import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:thru_ai_menu/main.dart';

void main() {
  testWidgets('Menu app smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const ThruAIMenuApp());

    expect(find.text('🍔 Burger Express'), findsOneWidget);
  });
}
