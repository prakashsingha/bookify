import { describe, it, expect } from "vitest";
import {
  BRAND_COLOR,
  BRAND_COLOR_HOVER,
  sampleBooks,
  MAX_FILE_SIZE,
  ACCEPTED_PDF_TYPES,
  MAX_IMAGE_SIZE,
  ACCEPTED_IMAGE_TYPES,
  voiceOptions,
  voiceCategories,
  DEFAULT_VOICE,
  VOICE_SETTINGS,
  VAPI_DASHBOARD_CONFIG,
  CLERK_AUTH_APPEARANCE_OVERRIDE,
} from "@/lib/constants";

describe("Brand colors", () => {
  it("BRAND_COLOR is a valid hex color string", () => {
    expect(BRAND_COLOR).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it("BRAND_COLOR_HOVER is a valid hex color string", () => {
    expect(BRAND_COLOR_HOVER).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it("BRAND_COLOR is different from BRAND_COLOR_HOVER", () => {
    expect(BRAND_COLOR).not.toBe(BRAND_COLOR_HOVER);
  });
});

describe("sampleBooks", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(sampleBooks)).toBe(true);
    expect(sampleBooks.length).toBeGreaterThan(0);
  });

  it("contains exactly 10 books", () => {
    expect(sampleBooks).toHaveLength(10);
  });

  it("each book has required fields: _id, title, author, slug, coverURL, coverColor", () => {
    sampleBooks.forEach((book) => {
      expect(book).toHaveProperty("_id");
      expect(book).toHaveProperty("title");
      expect(book).toHaveProperty("author");
      expect(book).toHaveProperty("slug");
      expect(book).toHaveProperty("coverURL");
      expect(book).toHaveProperty("coverColor");
    });
  });

  it("each book _id is a unique string", () => {
    const ids = sampleBooks.map((b) => b._id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(sampleBooks.length);
  });

  it("each book slug is a unique string", () => {
    const slugs = sampleBooks.map((b) => b.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(sampleBooks.length);
  });

  it("each book coverURL is a non-empty string", () => {
    sampleBooks.forEach((book) => {
      expect(typeof book.coverURL).toBe("string");
      expect(book.coverURL.length).toBeGreaterThan(0);
    });
  });

  it("each book title is a non-empty string", () => {
    sampleBooks.forEach((book) => {
      expect(typeof book.title).toBe("string");
      expect(book.title.length).toBeGreaterThan(0);
    });
  });

  it("each book author is a non-empty string", () => {
    sampleBooks.forEach((book) => {
      expect(typeof book.author).toBe("string");
      expect(book.author.length).toBeGreaterThan(0);
    });
  });

  it("contains known books by title", () => {
    const titles = sampleBooks.map((b) => b.title);
    expect(titles).toContain("Clean Code");
    expect(titles).toContain("Atomic Habits");
    expect(titles).toContain("1984");
  });

  it("slugs are URL-friendly (lowercase, hyphens, no spaces)", () => {
    sampleBooks.forEach((book) => {
      expect(book.slug).toMatch(/^[a-z0-9-]+$/);
    });
  });
});

describe("File size constants", () => {
  it("MAX_FILE_SIZE equals 50MB in bytes", () => {
    expect(MAX_FILE_SIZE).toBe(50 * 1024 * 1024);
  });

  it("MAX_IMAGE_SIZE equals 10MB in bytes", () => {
    expect(MAX_IMAGE_SIZE).toBe(10 * 1024 * 1024);
  });

  it("MAX_IMAGE_SIZE is less than MAX_FILE_SIZE", () => {
    expect(MAX_IMAGE_SIZE).toBeLessThan(MAX_FILE_SIZE);
  });
});

describe("ACCEPTED_PDF_TYPES", () => {
  it("is an array", () => {
    expect(Array.isArray(ACCEPTED_PDF_TYPES)).toBe(true);
  });

  it("includes application/pdf", () => {
    expect(ACCEPTED_PDF_TYPES).toContain("application/pdf");
  });
});

describe("ACCEPTED_IMAGE_TYPES", () => {
  it("is an array", () => {
    expect(Array.isArray(ACCEPTED_IMAGE_TYPES)).toBe(true);
  });

  it("includes image/jpeg", () => {
    expect(ACCEPTED_IMAGE_TYPES).toContain("image/jpeg");
  });

  it("includes image/png", () => {
    expect(ACCEPTED_IMAGE_TYPES).toContain("image/png");
  });

  it("includes image/webp", () => {
    expect(ACCEPTED_IMAGE_TYPES).toContain("image/webp");
  });

  it("all entries start with 'image/'", () => {
    ACCEPTED_IMAGE_TYPES.forEach((type) => {
      expect(type).toMatch(/^image\//);
    });
  });
});

describe("voiceOptions", () => {
  const expectedVoices = ["dave", "daniel", "chris", "rachel", "sarah"] as const;

  expectedVoices.forEach((voiceName) => {
    it(`contains the voice "${voiceName}"`, () => {
      expect(voiceOptions).toHaveProperty(voiceName);
    });

    it(`voice "${voiceName}" has id, name, and description`, () => {
      const voice = voiceOptions[voiceName];
      expect(voice).toHaveProperty("id");
      expect(voice).toHaveProperty("name");
      expect(voice).toHaveProperty("description");
      expect(typeof voice.id).toBe("string");
      expect(typeof voice.name).toBe("string");
      expect(typeof voice.description).toBe("string");
    });

    it(`voice "${voiceName}" has a non-empty id`, () => {
      expect(voiceOptions[voiceName].id.length).toBeGreaterThan(0);
    });
  });

  it("all voice IDs are unique", () => {
    const ids = Object.values(voiceOptions).map((v) => v.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe("voiceCategories", () => {
  it("has male and female categories", () => {
    expect(voiceCategories).toHaveProperty("male");
    expect(voiceCategories).toHaveProperty("female");
  });

  it("male category contains dave, daniel, chris", () => {
    expect(voiceCategories.male).toContain("dave");
    expect(voiceCategories.male).toContain("daniel");
    expect(voiceCategories.male).toContain("chris");
  });

  it("female category contains rachel and sarah", () => {
    expect(voiceCategories.female).toContain("rachel");
    expect(voiceCategories.female).toContain("sarah");
  });

  it("all categorized voice names exist in voiceOptions", () => {
    const allCategorized = [
      ...voiceCategories.male,
      ...voiceCategories.female,
    ];
    allCategorized.forEach((name) => {
      expect(voiceOptions).toHaveProperty(name);
    });
  });

  it("categories cover all voices (no voice uncategorized)", () => {
    const allCategorized = new Set([
      ...voiceCategories.male,
      ...voiceCategories.female,
    ]);
    const allVoiceNames = Object.keys(voiceOptions);
    allVoiceNames.forEach((name) => {
      expect(allCategorized.has(name)).toBe(true);
    });
  });
});

describe("DEFAULT_VOICE", () => {
  it("is a string", () => {
    expect(typeof DEFAULT_VOICE).toBe("string");
  });

  it("is a valid voice option", () => {
    expect(voiceOptions).toHaveProperty(DEFAULT_VOICE);
  });
});

describe("VOICE_SETTINGS", () => {
  it("has stability between 0 and 1", () => {
    expect(VOICE_SETTINGS.stability).toBeGreaterThanOrEqual(0);
    expect(VOICE_SETTINGS.stability).toBeLessThanOrEqual(1);
  });

  it("has similarityBoost between 0 and 1", () => {
    expect(VOICE_SETTINGS.similarityBoost).toBeGreaterThanOrEqual(0);
    expect(VOICE_SETTINGS.similarityBoost).toBeLessThanOrEqual(1);
  });

  it("has speed as a positive number", () => {
    expect(VOICE_SETTINGS.speed).toBeGreaterThan(0);
  });

  it("has useSpeakerBoost as a boolean", () => {
    expect(typeof VOICE_SETTINGS.useSpeakerBoost).toBe("boolean");
  });
});

describe("VAPI_DASHBOARD_CONFIG", () => {
  it("has startSpeakingPlan with smartEndpointingEnabled", () => {
    expect(VAPI_DASHBOARD_CONFIG.startSpeakingPlan).toHaveProperty(
      "smartEndpointingEnabled"
    );
    expect(
      typeof VAPI_DASHBOARD_CONFIG.startSpeakingPlan.smartEndpointingEnabled
    ).toBe("boolean");
  });

  it("has silenceTimeoutSeconds as a positive number", () => {
    expect(VAPI_DASHBOARD_CONFIG.silenceTimeoutSeconds).toBeGreaterThan(0);
  });

  it("has backchannelingEnabled as a boolean", () => {
    expect(typeof VAPI_DASHBOARD_CONFIG.backchannelingEnabled).toBe("boolean");
  });
});

describe("CLERK_AUTH_APPEARANCE_OVERRIDE", () => {
  it("is a non-null object", () => {
    expect(CLERK_AUTH_APPEARANCE_OVERRIDE).toBeDefined();
    expect(typeof CLERK_AUTH_APPEARANCE_OVERRIDE).toBe("object");
  });

  it("has rootBox, card, headerTitle keys", () => {
    expect(CLERK_AUTH_APPEARANCE_OVERRIDE).toHaveProperty("rootBox");
    expect(CLERK_AUTH_APPEARANCE_OVERRIDE).toHaveProperty("card");
    expect(CLERK_AUTH_APPEARANCE_OVERRIDE).toHaveProperty("headerTitle");
  });

  it("all values are strings", () => {
    Object.values(CLERK_AUTH_APPEARANCE_OVERRIDE).forEach((val) => {
      expect(typeof val).toBe("string");
    });
  });
});