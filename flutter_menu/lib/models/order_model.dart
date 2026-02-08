class OrderItem {
  final String name;
  final int quantity;
  final double price;
  final List<String>? modifiers;
  final String? size;

  OrderItem({
    required this.name,
    required this.quantity,
    required this.price,
    this.modifiers,
    this.size,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      name: json['name'] ?? '',
      quantity: json['quantity'] ?? 1,
      price: (json['price'] ?? 0).toDouble(),
      modifiers: json['modifiers'] != null
          ? List<String>.from(json['modifiers'])
          : null,
      size: json['size'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'quantity': quantity,
      'price': price,
      'modifiers': modifiers,
      'size': size,
    };
  }
}

class Order {
  final String orderId;
  final int orderNumber;
  final List<OrderItem> items;
  final double total;
  final String status; // 'in_progress', 'complete'
  final String? kitchenStatus; // 'pending', 'preparing', 'ready', 'served'
  final DateTime timestamp;

  Order({
    required this.orderId,
    required this.orderNumber,
    required this.items,
    required this.total,
    required this.status,
    this.kitchenStatus,
    required this.timestamp,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      orderId: json['orderId'] ?? json['id'] ?? '',
      orderNumber: json['orderNumber'] ?? 0,
      items: json['items'] != null
          ? (json['items'] as List)
              .map((item) => OrderItem.fromJson(item))
              .toList()
          : [],
      total: (json['total'] ?? 0).toDouble(),
      status: json['status'] ?? 'in_progress',
      kitchenStatus: json['kitchenStatus'],
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'])
          : json['createdAt'] != null
              ? DateTime.parse(json['createdAt'])
              : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'orderId': orderId,
      'orderNumber': orderNumber,
      'items': items.map((item) => item.toJson()).toList(),
      'total': total,
      'status': status,
      'kitchenStatus': kitchenStatus,
      'timestamp': timestamp.toIso8601String(),
    };
  }

  Order copyWith({
    String? orderId,
    int? orderNumber,
    List<OrderItem>? items,
    double? total,
    String? status,
    String? kitchenStatus,
    DateTime? timestamp,
  }) {
    return Order(
      orderId: orderId ?? this.orderId,
      orderNumber: orderNumber ?? this.orderNumber,
      items: items ?? this.items,
      total: total ?? this.total,
      status: status ?? this.status,
      kitchenStatus: kitchenStatus ?? this.kitchenStatus,
      timestamp: timestamp ?? this.timestamp,
    );
  }
}
