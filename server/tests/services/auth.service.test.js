jest.mock("../../prisma/client", () =>
  require("../../prisma/client.mock")
);

const prismaMock = require("../../prisma/client.mock");
const authService = require("../../services/auth.service");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

describe("auth.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================
  // REGISTER
  // =========================================================

  describe("register", () => {
    it("rejects registration when name is missing", async () => {
      await expect(
        authService.register("", "test@example.com", "password123")
      ).rejects.toThrow("Name, email and password are required");
    });

    it("rejects registration when email is missing", async () => {
      await expect(
        authService.register("John", "", "password123")
      ).rejects.toThrow("Name, email and password are required");
    });

    it("rejects registration when password is missing", async () => {
      await expect(
        authService.register("John", "test@example.com", "")
      ).rejects.toThrow("Name, email and password are required");
    });

    it("hashes the password before storing the user", async () => {
      const hashedPassword = "hashed-password";

      jest
        .spyOn(bcrypt, "hash")
        .mockResolvedValue(hashedPassword);

      prismaMock.user.create.mockResolvedValue({
        id: 1,
        name: "John",
        email: "john@example.com",
        password: hashedPassword,
        role: "CUSTOMER",
      });

      await authService.register(
        "John",
        "john@example.com",
        "password123"
      );

      expect(bcrypt.hash).toHaveBeenCalledWith(
        "password123",
        10
      );

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          name: "John",
          email: "john@example.com",
          password: hashedPassword,
        },
      });
    });

    it("successfully registers a user", async () => {
      prismaMock.user.create.mockResolvedValue({
        id: 1,
        name: "John",
        email: "john@example.com",
        password: "hashed-password",
        role: "CUSTOMER",
      });

      const result = await authService.register(
        "John",
        "john@example.com",
        "password123"
      );

      expect(result).toEqual({
        id: 1,
        name: "John",
        email: "john@example.com",
        role: "CUSTOMER",
      });
    });

    it("does not return the user's password", async () => {
      prismaMock.user.create.mockResolvedValue({
        id: 1,
        name: "John",
        email: "john@example.com",
        password: "hashed-password",
        role: "CUSTOMER",
      });

      const result = await authService.register(
        "John",
        "john@example.com",
        "password123"
      );

      expect(result.password).toBeUndefined();
    });

    it("handles duplicate email with a 409 error", async () => {
      const prismaError = new Error("Unique constraint failed");
      prismaError.code = "P2002";

      prismaMock.user.create.mockRejectedValue(prismaError);

      await expect(
        authService.register(
          "John",
          "john@example.com",
          "password123"
        )
      ).rejects.toMatchObject({
        message: "Email already exists",
        status: 409,
      });
    });

    it("propagates unexpected database errors", async () => {
      const databaseError = new Error("Database connection failed");

      prismaMock.user.create.mockRejectedValue(databaseError);

      await expect(
        authService.register(
          "John",
          "john@example.com",
          "password123"
        )
      ).rejects.toThrow("Database connection failed");
    });
  });

  // =========================================================
  // LOGIN
  // =========================================================

  describe("login", () => {
    const user = {
      id: 1,
      name: "John",
      email: "john@example.com",
      password: "hashed-password",
      role: "CUSTOMER",
    };

    it("rejects login when user does not exist", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login(
          "john@example.com",
          "password123"
        )
      ).rejects.toMatchObject({
        message: "Invalid email or password",
        status: 401,
      });
    });

    it("rejects login when password is incorrect", async () => {
      prismaMock.user.findUnique.mockResolvedValue(user);

      jest
        .spyOn(bcrypt, "compare")
        .mockResolvedValue(false);

      await expect(
        authService.login(
          "john@example.com",
          "wrong-password"
        )
      ).rejects.toMatchObject({
        message: "Invalid email or password",
        status: 401,
      });
    });

    it("checks the supplied password against the stored hash", async () => {
      prismaMock.user.findUnique.mockResolvedValue(user);

      jest
        .spyOn(bcrypt, "compare")
        .mockResolvedValue(false);

      await expect(
        authService.login(
          "john@example.com",
          "wrong-password"
        )
      ).rejects.toThrow("Invalid email or password");

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "wrong-password",
        "hashed-password"
      );
    });

    it("successfully logs in a user with valid credentials", async () => {
      prismaMock.user.findUnique.mockResolvedValue(user);

      jest
        .spyOn(bcrypt, "compare")
        .mockResolvedValue(true);

      jest
        .spyOn(jwt, "sign")
        .mockReturnValueOnce("access-token")
        .mockReturnValueOnce("refresh-token");

      prismaMock.refreshToken.create.mockResolvedValue({
        id: 1,
        token: "refresh-token",
        userId: 1,
      });

      const result = await authService.login(
        "john@example.com",
        "password123"
      );

      expect(result.accessToken).toBe("access-token");
      expect(result.refreshToken).toBe("refresh-token");
      expect(result.user).toEqual({
        id: 1,
        name: "John",
        email: "john@example.com",
        role: "CUSTOMER",
      });
    });

    it("generates an access token containing user ID and role", async () => {
      prismaMock.user.findUnique.mockResolvedValue(user);

      jest
        .spyOn(bcrypt, "compare")
        .mockResolvedValue(true);

      const signSpy = jest
        .spyOn(jwt, "sign")
        .mockReturnValueOnce("access-token")
        .mockReturnValueOnce("refresh-token");

      prismaMock.refreshToken.create.mockResolvedValue({});

      await authService.login(
        "john@example.com",
        "password123"
      );

      expect(signSpy).toHaveBeenNthCalledWith(
        1,
        {
          userId: 1,
          role: "CUSTOMER",
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "1h",
        }
      );
    });

    it("generates a refresh token containing the user ID", async () => {
      prismaMock.user.findUnique.mockResolvedValue(user);

      jest
        .spyOn(bcrypt, "compare")
        .mockResolvedValue(true);

      const signSpy = jest
        .spyOn(jwt, "sign")
        .mockReturnValueOnce("access-token")
        .mockReturnValueOnce("refresh-token");

      prismaMock.refreshToken.create.mockResolvedValue({});

      await authService.login(
        "john@example.com",
        "password123"
      );

      expect(signSpy).toHaveBeenNthCalledWith(
        2,
        {
          userId: 1,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIn: "7d",
        }
      );
    });

    it("stores the refresh token in the database", async () => {
      prismaMock.user.findUnique.mockResolvedValue(user);

      jest
        .spyOn(bcrypt, "compare")
        .mockResolvedValue(true);

      jest
        .spyOn(jwt, "sign")
        .mockReturnValueOnce("access-token")
        .mockReturnValueOnce("refresh-token");

      prismaMock.refreshToken.create.mockResolvedValue({});

      await authService.login(
        "john@example.com",
        "password123"
      );

      expect(
        prismaMock.refreshToken.create
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            token: "refresh-token",
            userId: 1,
            expiresAt: expect.any(Date),
          }),
        })
      );
    });

    it("does not return the user's password after login", async () => {
      prismaMock.user.findUnique.mockResolvedValue(user);

      jest
        .spyOn(bcrypt, "compare")
        .mockResolvedValue(true);

      jest
        .spyOn(jwt, "sign")
        .mockReturnValueOnce("access-token")
        .mockReturnValueOnce("refresh-token");

      prismaMock.refreshToken.create.mockResolvedValue({});

      const result = await authService.login(
        "john@example.com",
        "password123"
      );

      expect(result.user.password).toBeUndefined();
    });
  });

  // =========================================================
  // REFRESH
  // =========================================================

  describe("refresh", () => {
    it("rejects when no refresh token is provided", async () => {
      await expect(
        authService.refresh()
      ).rejects.toMatchObject({
        message: "No refresh token provided",
        status: 401,
      });
    });

    it("rejects when refresh token is not stored in database", async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValue(null);

      await expect(
        authService.refresh("unknown-token")
      ).rejects.toMatchObject({
        message: "Invalid refresh token",
        status: 403,
      });
    });

    it("deletes an expired refresh token", async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValue({
        id: 10,
        token: "expired-token",
        expiresAt: new Date(Date.now() - 1000),
      });

      prismaMock.refreshToken.delete.mockResolvedValue({});

      await expect(
        authService.refresh("expired-token")
      ).rejects.toMatchObject({
        message: "Refresh token expired",
        status: 403,
      });

      expect(
        prismaMock.refreshToken.delete
      ).toHaveBeenCalledWith({
        where: { id: 10 },
      });
    });

    it("rejects an invalid JWT refresh token", async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValue({
        id: 10,
        token: "invalid-token",
        expiresAt: new Date(Date.now() + 60000),
      });

      jest
        .spyOn(jwt, "verify")
        .mockImplementation(() => {
          throw new Error("Invalid token");
        });

      await expect(
        authService.refresh("invalid-token")
      ).rejects.toMatchObject({
        message: "Invalid refresh token",
        status: 403,
      });
    });

    it("generates a new access token from a valid refresh token", async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValue({
        id: 10,
        token: "valid-refresh-token",
        expiresAt: new Date(Date.now() + 60000),
      });

      jest
        .spyOn(jwt, "verify")
        .mockReturnValue({
          userId: 1,
        });

      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        name: "John",
        email: "john@example.com",
        role: "CUSTOMER",
      });

      jest
        .spyOn(jwt, "sign")
        .mockReturnValue("new-access-token");

      const result = await authService.refresh(
        "valid-refresh-token"
      );

      expect(result).toBe("new-access-token");

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          userId: 1,
          role: "CUSTOMER",
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "1h",
        }
      );
    });

    it("verifies the refresh token using the refresh token secret", async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValue({
        id: 10,
        token: "valid-refresh-token",
        expiresAt: new Date(Date.now() + 60000),
      });

      const verifySpy = jest
        .spyOn(jwt, "verify")
        .mockReturnValue({
          userId: 1,
        });

      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        role: "CUSTOMER",
      });

      jest
        .spyOn(jwt, "sign")
        .mockReturnValue("new-access-token");

      await authService.refresh("valid-refresh-token");

      expect(verifySpy).toHaveBeenCalledWith(
        "valid-refresh-token",
        process.env.REFRESH_TOKEN_SECRET
      );
    });
  });

  // =========================================================
  // LOGOUT
  // =========================================================

  describe("logout", () => {
    it("deletes the refresh token when one is provided", async () => {
      prismaMock.refreshToken.deleteMany.mockResolvedValue({
        count: 1,
      });

      await authService.logout("refresh-token");

      expect(
        prismaMock.refreshToken.deleteMany
      ).toHaveBeenCalledWith({
        where: {
          token: "refresh-token",
        },
      });
    });

    it("does nothing when no refresh token is provided", async () => {
      await authService.logout();

      expect(
        prismaMock.refreshToken.deleteMany
      ).not.toHaveBeenCalled();
    });
  });

  // =========================================================
  // CHANGE PASSWORD
  // =========================================================

  describe("changePassword", () => {
    it("rejects when old password is missing", async () => {
      await expect(
        authService.changePassword(
          1,
          "",
          "newpassword123"
        )
      ).rejects.toMatchObject({
        message: "Old password and new password are required",
        status: 400,
      });
    });

    it("rejects when new password is missing", async () => {
      await expect(
        authService.changePassword(
          1,
          "oldpassword",
          ""
        )
      ).rejects.toMatchObject({
        message: "Old password and new password are required",
        status: 400,
      });
    });

    it("rejects when the new password is the same as the old password", async () => {
      await expect(
        authService.changePassword(
          1,
          "samepassword",
          "samepassword"
        )
      ).rejects.toMatchObject({
        message: "New password must be different from old password",
        status: 400,
      });
    });

    it("rejects a new password shorter than 8 characters", async () => {
      await expect(
        authService.changePassword(
          1,
          "oldpassword",
          "short"
        )
      ).rejects.toMatchObject({
        message: "New password must be at least 8 characters",
        status: 400,
      });
    });

    it("throws when the user does not exist", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.changePassword(
          99,
          "oldpassword",
          "newpassword123"
        )
      ).rejects.toMatchObject({
        message: "User not found",
        status: 404,
      });
    });

    it("rejects when the old password is incorrect", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        password: "hashed-old-password",
      });

      jest
        .spyOn(bcrypt, "compare")
        .mockResolvedValue(false);

      await expect(
        authService.changePassword(
          1,
          "wrongpassword",
          "newpassword123"
        )
      ).rejects.toMatchObject({
        message: "Old password is incorrect",
        status: 401,
      });
    });

    it("checks the old password against the stored password hash", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        password: "hashed-old-password",
      });

      jest
        .spyOn(bcrypt, "compare")
        .mockResolvedValue(false);

      await expect(
        authService.changePassword(
          1,
          "oldpassword",
          "newpassword123"
        )
      ).rejects.toThrow("Old password is incorrect");

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "oldpassword",
        "hashed-old-password"
      );
    });

    it("hashes the new password before updating the user", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        password: "hashed-old-password",
      });

      jest
        .spyOn(bcrypt, "compare")
        .mockResolvedValue(true);

      jest
        .spyOn(bcrypt, "hash")
        .mockResolvedValue("hashed-new-password");

      prismaMock.user.update.mockResolvedValue({
        id: 1,
      });

      await authService.changePassword(
        1,
        "oldpassword",
        "newpassword123"
      );

      expect(bcrypt.hash).toHaveBeenCalledWith(
        "newpassword123",
        10
      );
    });

    it("updates the password and disables mustChangePassword", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        password: "hashed-old-password",
      });

      jest
        .spyOn(bcrypt, "compare")
        .mockResolvedValue(true);

      jest
        .spyOn(bcrypt, "hash")
        .mockResolvedValue("hashed-new-password");

      prismaMock.user.update.mockResolvedValue({
        id: 1,
      });

      await authService.changePassword(
        1,
        "oldpassword",
        "newpassword123"
      );

      expect(
        prismaMock.user.update
      ).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          password: "hashed-new-password",
          mustChangePassword: false,
        },
      });
    });

    it("returns a success message after changing the password", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        password: "hashed-old-password",
      });

      jest
        .spyOn(bcrypt, "compare")
        .mockResolvedValue(true);

      jest
        .spyOn(bcrypt, "hash")
        .mockResolvedValue("hashed-new-password");

      prismaMock.user.update.mockResolvedValue({
        id: 1,
      });

      const result = await authService.changePassword(
        1,
        "oldpassword",
        "newpassword123"
      );

      expect(result).toEqual({
        message: "Password changed successfully",
      });
    });
  });
});