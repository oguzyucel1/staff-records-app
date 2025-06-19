import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Function to ensure storage bucket exists
export const ensureStorageBucket = async () => {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) throw listError;

    const bucketExists = buckets.some(
      (bucket) => bucket.name === "profile-pictures"
    );

    if (!bucketExists) {
      // Create bucket if it doesn't exist
      const { error: createError } = await supabase.storage.createBucket(
        "profile-pictures",
        {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ["image/jpeg", "image/png"],
        }
      );

      if (createError) throw createError;

      // Set bucket policy to allow authenticated users to upload and read
      const { error: policyError } = await supabase.storage
        .from("profile-pictures")
        .createSignedUrl("policy.json", 31536000, {
          transform: {
            width: 200,
            height: 200,
            resize: "cover",
          },
        });

      if (policyError) throw policyError;
    }

    console.log("Storage bucket check completed");
  } catch (error) {
    console.error("Error ensuring storage bucket:", error);
  }
};
