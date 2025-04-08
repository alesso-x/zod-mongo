import { z } from "zod";
import { ObjectId } from "mongodb";
import { ZodMongoRepository, ZodMongoDocument } from "..";

// Define the base schema
const userProfileSchema = z.object({
  _id: z.instanceof(ObjectId),
  userId: z.string(),
  hasCompletedOnboarding: z.boolean(),
  preferences: z
    .object({
      theme: z.enum(["light", "dark"]).optional(),
      notifications: z.boolean().optional(),
    })
    .optional(),
});

type UserProfile = ZodMongoDocument<z.infer<typeof userProfileSchema>>;

class UserProfileModel extends ZodMongoRepository<UserProfile> {
  constructor() {
    super({
      collectionName: "user_profiles",
      schema: userProfileSchema,
    });
  }

  async getOrCreateProfile(userId: string): Promise<UserProfile> {
    const existingProfile = await this.findOne({ userId });
    if (existingProfile) {
      return existingProfile;
    }

    const { doc } = await this.insertOne({
      userId,
      hasCompletedOnboarding: false,
    });
    return doc;
  }

  async updateProfile(
    userId: string,
    data: Partial<UserProfile>
  ): Promise<UserProfile | null> {
    const result = await this.updateOne(
      { userId },
      { $set: { ...data, updatedAt: new Date() } }
    );
    if (result.modifiedCount === 0) {
      return null;
    }
    return this.findOne({ userId });
  }
}

describe("Extended Repository", () => {
  let userProfileModel: UserProfileModel;

  beforeAll(async () => {
    // Create repository
    userProfileModel = new UserProfileModel();
  });

  afterEach(async () => {
    await userProfileModel.deleteMany({});
  });

  it("should create a new profile if one doesn't exist", async () => {
    const userId = "test-user-1";
    const profile = await userProfileModel.getOrCreateProfile(userId);

    expect(profile).toBeDefined();
    expect(profile.userId).toBe(userId);
    expect(profile.hasCompletedOnboarding).toBe(false);
    expect(profile._id).toBeInstanceOf(ObjectId);
    expect(profile.createdAt).toBeInstanceOf(Date);
    expect(profile.updatedAt).toBeInstanceOf(Date);
  });

  it("should return existing profile if one exists", async () => {
    const userId = "test-user-2";

    // Create initial profile
    const initialProfile = await userProfileModel.getOrCreateProfile(userId);

    // Try to get or create again
    const existingProfile = await userProfileModel.getOrCreateProfile(userId);

    expect(existingProfile._id).toEqual(initialProfile._id);
  });

  it("should update profile successfully", async () => {
    const userId = "test-user-3";
    const profile = await userProfileModel.getOrCreateProfile(userId);

    const updatedProfile = await userProfileModel.updateProfile(userId, {
      hasCompletedOnboarding: true,
      preferences: {
        theme: "dark",
        notifications: true,
      },
    });

    expect(updatedProfile).toBeDefined();
    expect(updatedProfile?.hasCompletedOnboarding).toBe(true);
    expect(updatedProfile?.preferences?.theme).toBe("dark");
    expect(updatedProfile?.preferences?.notifications).toBe(true);
  });

  it("should return null when updating non-existent profile", async () => {
    const result = await userProfileModel.updateProfile("non-existent-user", {
      hasCompletedOnboarding: true,
    });

    expect(result).toBeNull();
  });
});
