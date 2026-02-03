import { auth } from "../app/lib/auth/config";

async function testAuth() {
  try {
    console.log("Testing Better-Auth API...\n");

    // Test sign in
    console.log("Attempting sign in with test@gallery.com...");

    const result = await auth.api.signInEmail({
      body: {
        email: "test@gallery.com",
        password: "Test123!",
      },
    });

    console.log("\n✅ Sign in successful!");
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("\n❌ Sign in failed:");
    console.error(error);
  }
}

testAuth();
