import request from "supertest";
import mongoose from "mongoose";
import app from "../app.js";
import User from "../models/user.model.js";

describe("Authentication Tests", () => {
  let server;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || "mongodb://localhost:27017/cinema_test";
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    // Clean up and close connections
    await User.deleteMany({});
    await mongoose.connection.close();
    if (server) {
      server.close();
    }
  });

  beforeEach(async () => {
    // Clear users before each test
    await User.deleteMany({});
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        email: "test@example.com",
        password: "123456",
        fullName: "Test User",
        phoneNumber: "0901234567",
      };

      const response = await request(app).post("/api/auth/register").send(userData).expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("token");
      expect(response.body.data.user).toHaveProperty("email", userData.email);
      expect(response.body.data.user).toHaveProperty("role", "customer");
    });

    it("should fail if email already exists", async () => {
      const userData = {
        email: "test@example.com",
        password: "123456",
        fullName: "Test User",
      };

      // Register first time
      await request(app).post("/api/auth/register").send(userData);

      // Try to register again
      const response = await request(app).post("/api/auth/register").send(userData).expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("đã được sử dụng");
    });

    it("should fail if required fields are missing", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          email: "test@example.com",
          // Missing password and fullName
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      // Create a test user
      await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        password: "123456",
        fullName: "Test User",
      });
    });

    it("should login successfully with correct credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "123456",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("token");
      expect(response.body.data.user).toHaveProperty("email", "test@example.com");
    });

    it("should fail with incorrect password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "wrongpassword",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it("should fail with non-existent email", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "123456",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/auth/me", () => {
    let token;

    beforeEach(async () => {
      // Register and get token
      const response = await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        password: "123456",
        fullName: "Test User",
      });

      token = response.body.data.token;
    });

    it("should get current user info with valid token", async () => {
      const response = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("email", "test@example.com");
    });

    it("should fail without token", async () => {
      const response = await request(app).get("/api/auth/me").expect(401);

      expect(response.body.success).toBe(false);
    });

    it("should fail with invalid token", async () => {
      const response = await request(app).get("/api/auth/me").set("Authorization", "Bearer invalid_token").expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /api/auth/change-password", () => {
    let token;

    beforeEach(async () => {
      const response = await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        password: "123456",
        fullName: "Test User",
      });

      token = response.body.data.token;
    });

    it("should change password successfully", async () => {
      const response = await request(app)
        .put("/api/auth/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          oldPassword: "123456",
          newPassword: "newpassword123",
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Try to login with new password
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "newpassword123",
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    it("should fail with incorrect old password", async () => {
      const response = await request(app)
        .put("/api/auth/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          oldPassword: "wrongpassword",
          newPassword: "newpassword123",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
