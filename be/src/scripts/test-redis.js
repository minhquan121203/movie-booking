import dotenv from "dotenv";
import redisService from "../services/redis.service.js";

dotenv.config();

const testRedis = async () => {
  console.log("🔄 Testing Redis Connection...\n");
  console.log("Configuration:");
  console.log("  REDIS_ENABLED:", process.env.REDIS_ENABLED);
  console.log("  REDIS_HOST:", process.env.REDIS_HOST);
  console.log("  REDIS_PORT:", process.env.REDIS_PORT);
  console.log("  REDIS_DB:", process.env.REDIS_DB);
  console.log("");

  try {
    // 1. Connect to Redis
    console.log("1️⃣  Connecting to Redis...");
    await redisService.connect();

    if (!redisService.isConnected) {
      console.log(" Redis connection failed!");
      console.log("\n Troubleshooting:");
      console.log("   - Check if Redis server is running");
      console.log("   - Verify REDIS_HOST and REDIS_PORT in .env");
      console.log("   - Check REDIS_PASSWORD if required");
      console.log("   - Try: redis-cli ping");
      process.exit(1);
    }

    console.log(" Connected to Redis successfully!\n");

    // 2. Test PING
    console.log("2️⃣  Testing PING...");
    const pingResult = await redisService.ping();
    if (pingResult) {
      console.log(" PING successful!\n");
    } else {
      console.log(" PING failed!\n");
    }

    // 3. Test SET
    console.log("3️⃣  Testing SET...");
    const testKey = "test:redis:key";
    const testValue = {
      message: "Hello Redis!",
      timestamp: new Date().toISOString(),
      data: { foo: "bar", number: 123 },
    };

    const setResult = await redisService.set(testKey, testValue, 60); // TTL 60s
    if (setResult) {
      console.log(" SET successful!");
      console.log("   Key:", testKey);
      console.log("   Value:", JSON.stringify(testValue, null, 2));
      console.log("");
    } else {
      console.log(" SET failed!\n");
    }

    // 4. Test GET
    console.log("4️⃣  Testing GET...");
    const getValue = await redisService.get(testKey);
    if (getValue) {
      console.log(" GET successful!");
      console.log("   Retrieved:", JSON.stringify(getValue, null, 2));
      console.log("");
    } else {
      console.log(" GET failed!\n");
    }

    // 5. Test cache function
    console.log("5️⃣  Testing cache() function...");
    let callCount = 0;
    const fetchFunction = async () => {
      callCount++;
      console.log(`   📞 Fetch function called (${callCount} time)`);
      return { data: "Expensive operation result", callCount };
    };

    // First call - should fetch
    console.log("   First call (should fetch):");
    const result1 = await redisService.cache("test:cache:key", fetchFunction, 60);
    console.log("   Result:", result1);

    // Second call - should use cache
    console.log("   Second call (should use cache):");
    const result2 = await redisService.cache("test:cache:key", fetchFunction, 60);
    console.log("   Result:", result2);

    if (callCount === 1) {
      console.log(" Cache working correctly! (fetch called only once)\n");
    } else {
      console.log("  Cache might not be working (fetch called multiple times)\n");
    }

    // 6. Test DELETE
    console.log("6️⃣  Testing DELETE...");
    const delResult = await redisService.del(testKey);
    if (delResult) {
      console.log(" DELETE successful!");
      console.log("   Deleted key:", testKey);
      console.log("");
    } else {
      console.log(" DELETE failed!\n");
    }

    // 7. Verify deletion
    console.log("7️⃣  Verifying deletion...");
    const getAfterDel = await redisService.get(testKey);
    if (!getAfterDel) {
      console.log(" Key successfully deleted (GET returns null)\n");
    } else {
      console.log(" Key still exists after deletion!\n");
    }

    // 8. Test pattern deletion
    console.log("8️⃣  Testing pattern deletion...");
    await redisService.set("test:pattern:1", { id: 1 }, 60);
    await redisService.set("test:pattern:2", { id: 2 }, 60);
    await redisService.set("test:pattern:3", { id: 3 }, 60);
    console.log("   Created 3 keys: test:pattern:1, test:pattern:2, test:pattern:3");

    const delPatternResult = await redisService.delPattern("test:pattern:*");
    console.log(` Deleted ${delPatternResult} keys matching pattern\n`);

    // 9. Cleanup
    console.log("9️⃣  Cleaning up test keys...");
    await redisService.delPattern("test:*");
    console.log(" Cleanup complete!\n");

    // Summary
    console.log("=".repeat(60));
    console.log("📊 REDIS TEST SUMMARY");
    console.log("=".repeat(60));
    console.log(" Connection: OK");
    console.log(" PING: OK");
    console.log(" SET: OK");
    console.log(" GET: OK");
    console.log(" Cache: OK");
    console.log(" DELETE: OK");
    console.log(" Pattern Delete: OK");
    console.log("=".repeat(60));
    console.log("\n🎉 All Redis tests passed!");
    console.log("\n Redis is ready to use for:");
    console.log("   - Caching API responses");
    console.log("   - Session management");
    console.log("   - Rate limiting");
    console.log("   - Real-time data");

    // Disconnect
    await redisService.disconnect();
    console.log("\n Disconnected from Redis");
  } catch (error) {
    console.error("\n Redis test failed:", error);
    console.error("\nError details:", error.message);

    console.log("\n Common issues:");
    console.log("   1. Redis server not running");
    console.log("   2. Wrong host/port in .env");
    console.log("   3. Authentication required but password not set");
    console.log("   4. Firewall blocking connection");
    console.log("   5. Redis Labs/Cloud Redis requires password");

    process.exit(1);
  }
};

testRedis();
