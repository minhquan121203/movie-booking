import request from "supertest";
import mongoose from "mongoose";
import app from "../app.js";
import User from "../models/user.model.js";
import Movie from "../models/movie.model.js";
import Genre from "../models/genre.model.js";

describe("Movie Tests", () => {
  let adminToken;
  let genreId;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_TEST_URI || "mongodb://localhost:27017/cinema_test";
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Movie.deleteMany({});
    await Genre.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Movie.deleteMany({});
    await Genre.deleteMany({});

    // Create admin user
    const adminResponse = await request(app).post("/api/auth/register").send({
      email: "admin@example.com",
      password: "123456",
      fullName: "Admin User",
    });

    adminToken = adminResponse.body.data.token;

    // Update user to admin role
    await User.findOneAndUpdate({ email: "admin@example.com" }, { role: "admin" });

    // Create genre
    const genre = await Genre.create({
      name: "Action",
      description: "Action movies",
    });
    genreId = genre._id;
  });

  describe("GET /api/movies", () => {
    beforeEach(async () => {
      await Movie.create([
        {
          title: "Movie 1",
          status: "Đang chiếu",
          duration: 120,
          rating: "C13",
          releaseDate: new Date(),
        },
        {
          title: "Movie 2",
          status: "Sắp chiếu",
          duration: 110,
          rating: "P",
          releaseDate: new Date(),
        },
      ]);
    });

    it("should get all movies", async () => {
      const response = await request(app).get("/api/movies").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.movies).toHaveLength(2);
    });

    it("should filter movies by status", async () => {
      const response = await request(app).get("/api/movies?status=Đang chiếu").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.movies).toHaveLength(1);
      expect(response.body.data.movies[0].status).toBe("Đang chiếu");
    });

    it("should search movies by title", async () => {
      const response = await request(app).get("/api/movies?search=Movie 1").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.movies).toHaveLength(1);
      expect(response.body.data.movies[0].title).toBe("Movie 1");
    });

    it("should paginate results", async () => {
      const response = await request(app).get("/api/movies?page=1&limit=1").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.movies).toHaveLength(1);
      expect(response.body.data.pagination.totalPages).toBe(2);
    });
  });

  describe("GET /api/movies/:id", () => {
    let movieId;

    beforeEach(async () => {
      const movie = await Movie.create({
        title: "Test Movie",
        status: "Đang chiếu",
        duration: 120,
        rating: "C13",
        genres: [genreId],
      });
      movieId = movie._id;
    });

    it("should get movie by id", async () => {
      const response = await request(app).get(`/api/movies/${movieId}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe("Test Movie");
    });

    it("should return 404 for non-existent movie", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app).get(`/api/movies/${fakeId}`).expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/admin/movies", () => {
    it("should create movie as admin", async () => {
      const movieData = {
        title: "New Movie",
        director: "Test Director",
        actors: ["Actor 1", "Actor 2"],
        duration: 120,
        description: "Test description",
        rating: "C13",
        releaseDate: new Date(),
        status: "Đang chiếu",
        genres: [genreId.toString()],
      };

      const response = await request(app)
        .post("/api/admin/movies")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(movieData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe("New Movie");
    });

    it("should fail without authentication", async () => {
      const response = await request(app)
        .post("/api/admin/movies")
        .send({
          title: "New Movie",
          status: "Đang chiếu",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /api/admin/movies/:id", () => {
    let movieId;

    beforeEach(async () => {
      const movie = await Movie.create({
        title: "Old Title",
        status: "Đang chiếu",
        duration: 120,
        rating: "C13",
      });
      movieId = movie._id;
    });

    it("should update movie as admin", async () => {
      const response = await request(app)
        .put(`/api/admin/movies/${movieId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "New Title",
          description: "Updated description",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe("New Title");
    });
  });

  describe("DELETE /api/admin/movies/:id", () => {
    let movieId;

    beforeEach(async () => {
      const movie = await Movie.create({
        title: "Movie to Delete",
        status: "Đang chiếu",
        duration: 120,
        rating: "C13",
      });
      movieId = movie._id;
    });

    it("should delete movie as admin", async () => {
      const response = await request(app)
        .delete(`/api/admin/movies/${movieId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify movie is deleted
      const movie = await Movie.findById(movieId);
      expect(movie).toBeNull();
    });
  });

  describe("GET /api/movies/now-showing", () => {
    beforeEach(async () => {
      await Movie.create([
        {
          title: "Now Showing 1",
          status: "Đang chiếu",
          duration: 120,
          rating: "C13",
          releaseDate: new Date(),
        },
        {
          title: "Upcoming 1",
          status: "Sắp chiếu",
          duration: 110,
          rating: "P",
          releaseDate: new Date(),
        },
      ]);
    });

    it("should get only now showing movies", async () => {
      const response = await request(app).get("/api/movies/now-showing").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.movies).toHaveLength(1);
      expect(response.body.data.movies[0].status).toBe("Đang chiếu");
    });
  });

  describe("GET /api/movies/upcoming", () => {
    beforeEach(async () => {
      await Movie.create([
        {
          title: "Now Showing 1",
          status: "Đang chiếu",
          duration: 120,
          rating: "C13",
          releaseDate: new Date(),
        },
        {
          title: "Upcoming 1",
          status: "Sắp chiếu",
          duration: 110,
          rating: "P",
          releaseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      ]);
    });

    it("should get only upcoming movies", async () => {
      const response = await request(app).get("/api/movies/upcoming").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.movies).toHaveLength(1);
      expect(response.body.data.movies[0].status).toBe("Sắp chiếu");
    });
  });
});
