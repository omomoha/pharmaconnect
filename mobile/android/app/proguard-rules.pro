# Flutter ProGuard Rules
# ═══════════════════════════════════════════════════════════════
# Keep Flutter framework classes from being obfuscated
-keep class io.flutter.** { *; }
-dontwarn io.flutter.embedding.**

# Google Play Core (required by Flutter for split APK support)
-keep class com.google.android.play.core.** { *; }
-dontwarn com.google.android.play.core.**

# Firebase
# Keep Firebase classes to ensure runtime dependency injection works
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Socket.IO
# Keep Socket.IO client classes
-keep class io.socket.** { *; }

# Model Classes
# Keep PharmaConnect model classes for JSON serialization/deserialization
-keep class com.pharmaconnect.** { *; }

# JSON Serialization
# Keep annotations needed for JSON serialization (toJson, fromJson)
-keepclassmembers class * {
  public static *** from*(...);
  public *** to*();
}

# Preserve source file names and line numbers for stack traces
-keepattributes SourceFile,LineNumberTable

# General optimization settings
-optimizationpasses 5
-dontusemixedcaseclassnames
-verbose

# Keep constructors needed by reflection
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep fragment constructors
-keepclasseswithmembers class * {
    public <init>(android.content.Context, android.util.AttributeSet);
}

# Keep service components
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver

# Warning configuration
-dontnote android.support.**
-dontnote androidx.**
