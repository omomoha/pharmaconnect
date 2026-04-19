import 'package:flutter_test/flutter_test.dart';
import 'package:pharmaconnect/services/validation_service.dart';

void main() {
  group('ValidationService - Email Validation', () {
    test('validateEmail returns error for empty email', () {
      final result = ValidationService.validateEmail('');

      expect(result, 'Email is required');
    });

    test('validateEmail returns error for invalid email format', () {
      final invalidEmails = [
        'notanemail',
        'missing@domain',
        '@example.com',
        'user@',
        'user@.com',
        'user name@example.com',
        'user+test@domain', // Missing TLD
      ];

      for (final email in invalidEmails) {
        final result = ValidationService.validateEmail(email);
        expect(result, 'Please enter a valid email address');
      }
    });

    test('validateEmail returns null for valid email', () {
      final validEmails = [
        'user@example.com',
        'john.doe@gmail.com',
        'test+tag@domain.co.uk',
        'name.email@company.org',
        'user123@test-domain.com',
        'a@b.co',
      ];

      for (final email in validEmails) {
        final result = ValidationService.validateEmail(email);
        expect(result, null);
      }
    });

    test('validateEmail handles edge cases', () {
      expect(ValidationService.validateEmail('user@domain.com'), null);
      expect(ValidationService.validateEmail('u@d.c'), null);
      expect(ValidationService.validateEmail('test_email@example-domain.com'), null);
    });
  });

  group('ValidationService - Phone Number Validation', () {
    test('validatePhone returns error for empty phone', () {
      final result = ValidationService.validatePhone('');

      expect(result, 'Phone number is required');
    });

    test('validatePhone returns error for invalid Nigerian phone', () {
      final invalidPhones = [
        '1234567890', // Wrong country code
        '+1234567890', // Non-Nigerian country code
        '081234567', // Too short
        '08123456789', // 11 digits with 0 prefix (should be 10)
        '+23481234567', // 11 digits with +234
        'abc def', // Not a number
        '0 8 0 1 2 3 4 5 6 7 8', // Spaces in wrong places
      ];

      for (final phone in invalidPhones) {
        final result = ValidationService.validatePhone(phone);
        expect(result, 'Please enter a valid Nigerian phone number (e.g., +2348012345678)');
      }
    });

    test('validatePhone returns null for valid Nigerian phone with 0 prefix', () {
      final validPhones = [
        '08012345678', // 0 followed by 10 digits
        '09123456789',
        '07098765432',
      ];

      for (final phone in validPhones) {
        final result = ValidationService.validatePhone(phone);
        expect(result, null);
      }
    });

    test('validatePhone returns null for valid Nigerian phone with +234', () {
      final validPhones = [
        '+2348012345678', // +234 followed by 10 digits
        '+2349123456789',
        '+2347098765432',
      ];

      for (final phone in validPhones) {
        final result = ValidationService.validatePhone(phone);
        expect(result, null);
      }
    });

    test('validatePhone handles formatting characters', () {
      expect(ValidationService.validatePhone('+234 801-234-5678'), null);
      expect(ValidationService.validatePhone('0801 (234) 5678'), null);
      expect(ValidationService.validatePhone('+234-801-234-5678'), null);
    });
  });

  group('ValidationService - Password Validation', () {
    test('validatePassword returns error for empty password', () {
      final result = ValidationService.validatePassword('');

      expect(result, 'Password is required');
    });

    test('validatePassword returns error for too short password', () {
      final result = ValidationService.validatePassword('Short1!');

      expect(result, 'Password must be at least 8 characters long');
    });

    test('validatePassword returns error for missing uppercase', () {
      final result = ValidationService.validatePassword('lowercase1!');

      expect(result, 'Password must contain at least one uppercase letter');
    });

    test('validatePassword returns error for missing lowercase', () {
      final result = ValidationService.validatePassword('UPPERCASE1!');

      expect(result, 'Password must contain at least one lowercase letter');
    });

    test('validatePassword returns error for missing number', () {
      final result = ValidationService.validatePassword('NoNumber!');

      expect(result, 'Password must contain at least one number');
    });

    test('validatePassword returns error for missing special character', () {
      final result = ValidationService.validatePassword('NoSpecial1');

      expect(result, 'Password must contain at least one special character (@, \$, !, %, *, ?, or &)');
    });

    test('validatePassword returns null for valid password', () {
      final validPasswords = [
        'ValidPass1!',
        'StrongPassword123@',
        'Secure\$Pass99',
        'MyPass%123word',
        'Test&Pass1',
        'Correct1*Horse',
      ];

      for (final password in validPasswords) {
        final result = ValidationService.validatePassword(password);
        expect(result, null);
      }
    });

    test('validatePassword accepts special characters', () {
      expect(ValidationService.validatePassword('Pass@1word'), null);
      expect(ValidationService.validatePassword('Pass\$1word'), null);
      expect(ValidationService.validatePassword('Pass!1word'), null);
      expect(ValidationService.validatePassword('Pass%1word'), null);
      expect(ValidationService.validatePassword('Pass*1word'), null);
      expect(ValidationService.validatePassword('Pass?1word'), null);
      expect(ValidationService.validatePassword('Pass&1word'), null);
    });
  });

  group('ValidationService - Amount Validation', () {
    test('validateAmount returns error for zero amount', () {
      final result = ValidationService.validateAmount(0.0);

      expect(result, 'Amount must be greater than 0');
    });

    test('validateAmount returns error for negative amount', () {
      final result = ValidationService.validateAmount(-100.0);

      expect(result, 'Amount must be greater than 0');
    });

    test('validateAmount returns error for amount exceeding limit', () {
      final result = ValidationService.validateAmount(10000001.0);

      expect(result, 'Amount cannot exceed 10,000,000');
    });

    test('validateAmount returns null for valid amount', () {
      final validAmounts = [
        0.01,
        1.0,
        100.0,
        1000.0,
        10000.0,
        100000.0,
        1000000.0,
        10000000.0,
      ];

      for (final amount in validAmounts) {
        final result = ValidationService.validateAmount(amount);
        expect(result, null);
      }
    });

    test('validateAmount handles edge cases', () {
      expect(ValidationService.validateAmount(0.001), null);
      expect(ValidationService.validateAmount(9999999.99), null);
      expect(ValidationService.validateAmount(10000000.0), null);
    });
  });

  group('ValidationService - Chat Message Validation', () {
    test('validateChatMessage returns error for empty message', () {
      final result = ValidationService.validateChatMessage('');

      expect(result, 'Message cannot be empty');
    });

    test('validateChatMessage returns error for message exceeding 1000 characters', () {
      final longMessage = 'a' * 1001;
      final result = ValidationService.validateChatMessage(longMessage);

      expect(result, 'Message cannot exceed 1000 characters');
    });

    test('validateChatMessage returns error for dangerous HTML', () {
      final dangerousMessages = [
        '<script>alert("xss")</script>',
        '<img src=x onerror="alert(1)">',
        '<iframe src="http://evil.com"></iframe>',
        '<object data="x"></object>',
        '<embed src="x">',
        'javascript:void(0)',
        'onclick="alert(1)"',
        'onload="malicious()"',
        '<p onclick="alert(1)">Click me</p>',
      ];

      for (final message in dangerousMessages) {
        final result = ValidationService.validateChatMessage(message);
        expect(result, 'Message contains invalid content');
      }
    });

    test('validateChatMessage returns null for valid message', () {
      final validMessages = [
        'Hello, how are you?',
        'I need help with my order',
        'Thanks for the medicine!',
        'Is this product available?',
        'Can you deliver to Lagos?',
        'Message with numbers 123 and symbols !@#',
        'a' * 1000, // Exactly 1000 characters
      ];

      for (final message in validMessages) {
        final result = ValidationService.validateChatMessage(message);
        expect(result, null);
      }
    });

    test('validateChatMessage allows safe HTML content', () {
      expect(ValidationService.validateChatMessage('Hello & welcome'), null);
      expect(ValidationService.validateChatMessage('Test "quoted" text'), null);
      expect(ValidationService.validateChatMessage("It's working fine"), null);
    });
  });

  group('ValidationService - Address Validation', () {
    test('validateAddress returns error for empty address', () {
      final result = ValidationService.validateAddress('');

      expect(result, 'Address is required');
    });

    test('validateAddress returns error for too short address', () {
      final shortAddresses = [
        '123 Main',
        'Lagos',
        '12345',
        'Apt 1',
      ];

      for (final address in shortAddresses) {
        final result = ValidationService.validateAddress(address);
        expect(result, 'Address must be at least 10 characters long');
      }
    });

    test('validateAddress returns null for valid address', () {
      final validAddresses = [
        '123 Main Street, Lagos',
        'Apartment 5, Building A, Ikoyi, Lagos',
        '42 Victoria Island, Lagos State',
        'Block 10, Plot 5, Lekki Phase 1, Lagos',
        'Plot 45, Banana Island, Ikoyi, Lagos State',
      ];

      for (final address in validAddresses) {
        final result = ValidationService.validateAddress(address);
        expect(result, null);
      }
    });

    test('validateAddress handles whitespace correctly', () {
      final result = ValidationService.validateAddress('   123 Main Street   ');

      expect(result, null);
    });
  });

  group('ValidationService - Input Sanitization', () {
    test('sanitizeInput removes HTML tags', () {
      final input = '<script>alert("xss")</script>Hello';
      final result = ValidationService.sanitizeInput(input);

      expect(result, 'alertxssHello');
    });

    test('sanitizeInput removes dangerous characters', () {
      final inputs = [
        'Hello<script>world',
        'Test&Code',
        '"quoted"text',
        'It\'s dangerous',
        'Back`ticks`here',
      ];

      final results = inputs.map(ValidationService.sanitizeInput).toList();

      for (final result in results) {
        expect(result.contains('<'), false);
        expect(result.contains('>'), false);
        expect(result.contains('&'), false);
        expect(result.contains('"'), false);
        expect(result.contains("'"), false);
        expect(result.contains('`'), false);
      }
    });

    test('sanitizeInput trims whitespace', () {
      final result = ValidationService.sanitizeInput('   test input   ');

      expect(result, 'test input');
    });

    test('sanitizeInput preserves safe content', () {
      final input = 'Hello, this is a safe message!';
      final result = ValidationService.sanitizeInput(input);

      expect(result, 'Hello, this is a safe message!');
    });

    test('sanitizeInput handles multiple tags', () {
      final input = '<p>Hello</p><script>alert(1)</script><div>World</div>';
      final result = ValidationService.sanitizeInput(input);

      expect(result.contains('<'), false);
      expect(result.contains('>'), false);
    });
  });
}
