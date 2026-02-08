import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'dart:async';
import '../models/order_model.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  IO.Socket? _socket;
  final _ordersController = StreamController<List<Order>>.broadcast();
  final _newOrderController = StreamController<Order>.broadcast();
  final _orderUpdateController = StreamController<Order>.broadcast();
  final _orderCompleteController = StreamController<Order>.broadcast();

  final List<Order> _orders = [];

  Stream<List<Order>> get ordersStream => _ordersController.stream;
  Stream<Order> get newOrderStream => _newOrderController.stream;
  Stream<Order> get orderUpdateStream => _orderUpdateController.stream;
  Stream<Order> get orderCompleteStream => _orderCompleteController.stream;

  List<Order> get currentOrders => List.unmodifiable(_orders);

  void connect(String serverUrl) {
    if (_socket != null && _socket!.connected) {
      print('✅ Socket already connected');
      return;
    }

    print('🔌 Connecting to server: $serverUrl');

    _socket = IO.io(
      serverUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setReconnectionAttempts(5)
          .setReconnectionDelay(2000)
          .build(),
    );

    _socket!.onConnect((_) {
      print('✅ Connected to server');
    });

    _socket!.onDisconnect((_) {
      print('⚠️ Disconnected from server');
    });

    _socket!.onConnectError((error) {
      print('❌ Connection error: $error');
    });

    _socket!.onError((error) {
      print('❌ Socket error: $error');
    });

    // Listen for initial orders
    _socket!.on('orders:init', (data) {
      print('📦 Received initial orders: $data');
      try {
        _orders.clear();
        if (data is List) {
          for (var orderData in data) {
            final order = Order.fromJson(orderData);
            _orders.add(order);
          }
        }
        _ordersController.add(List.from(_orders));
      } catch (e) {
        print('❌ Error parsing initial orders: $e');
      }
    });

    // Listen for new orders
    _socket!.on('order:new', (data) {
      print('🆕 New order received: $data');
      try {
        final order = Order.fromJson(data);
        _orders.add(order);
        _newOrderController.add(order);
        _ordersController.add(List.from(_orders));
      } catch (e) {
        print('❌ Error parsing new order: $e');
      }
    });

    // Listen for order updates
    _socket!.on('order:update', (data) {
      print('🔄 Order update received: $data');
      try {
        final updatedOrder = Order.fromJson(data);
        final index = _orders.indexWhere((o) => o.orderId == updatedOrder.orderId);
        if (index != -1) {
          _orders[index] = updatedOrder;
          _orderUpdateController.add(updatedOrder);
          _ordersController.add(List.from(_orders));
        }
      } catch (e) {
        print('❌ Error parsing order update: $e');
      }
    });

    // Listen for completed orders
    _socket!.on('order:complete', (data) {
      print('✅ Order completed: $data');
      try {
        final completedOrder = Order.fromJson(data);
        final index = _orders.indexWhere((o) => o.orderId == completedOrder.orderId);
        if (index != -1) {
          _orders[index] = completedOrder;
          _orderCompleteController.add(completedOrder);
          _ordersController.add(List.from(_orders));
        }
      } catch (e) {
        print('❌ Error parsing completed order: $e');
      }
    });

    _socket!.connect();
  }

  void updateOrderStatus(String orderId, String kitchenStatus) {
    if (_socket != null && _socket!.connected) {
      _socket!.emit('order:status', {
        'orderId': orderId,
        'kitchenStatus': kitchenStatus,
      });
      print('📤 Sent status update: $orderId -> $kitchenStatus');
    }
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }

  void dispose() {
    disconnect();
    _ordersController.close();
    _newOrderController.close();
    _orderUpdateController.close();
    _orderCompleteController.close();
  }
}
