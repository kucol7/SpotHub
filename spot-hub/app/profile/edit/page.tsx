"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { AlertCircle, CheckCircle2, Loader2, Pen, User, X } from "lucide-react";
import { createClient } from "../../../lib/supabase/client";

const BIO_MAX_LENGTH = 500;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Nie udało się wczytać zdjęcia"));
    image.src = src;
  });
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await loadImage(imageSrc);

  const width = Math.round(pixelCrop.width);
  const height = Math.round(pixelCrop.height);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Nie udało się utworzyć kontekstu canvas");
  }

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    width,
    height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Nie udało się przyciąć zdjęcia"));
        }
      },
      "image/webp",
      0.9,
    );
  });
}

export default function EditProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [initialUsername, setInitialUsername] = useState("");
  const [email, setEmail] = useState("");
  const [initialEmail, setInitialEmail] = useState("");
  const [bio, setBio] = useState("");
  const [initialBio, setInitialBio] = useState("");
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);

  const [newAvatarBlob, setNewAvatarBlob] = useState<Blob | null>(null);
  const [newAvatarPreview, setNewAvatarPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    supabase.auth
      .getUser()
      .then(async ({ data: { user } }) => {
        if (!mounted) return;

        if (!user) {
          router.push("/login");
          return;
        }

        setUserId(user.id);

        const initialEmailValue = user.email ?? "";
        setEmail(initialEmailValue);
        setInitialEmail(initialEmailValue);

        let initialUsernameValue =
          typeof user.user_metadata?.username === "string" &&
          user.user_metadata.username
            ? user.user_metadata.username
            : "";
        let initialBioValue = "";

        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, avatar_url, bio")
            .eq("id", user.id)
            .maybeSingle();

          if (profile?.username) {
            initialUsernameValue = profile.username;
          }
          if (profile?.avatar_url) {
            setCurrentAvatarUrl(profile.avatar_url);
          }
          if (typeof profile?.bio === "string") {
            initialBioValue = profile.bio;
          }
        } catch {
          // Tabela "profiles" może jeszcze nie istnieć.
        }

        setUsername(initialUsernameValue);
        setInitialUsername(initialUsernameValue);
        setBio(initialBioValue);
        setInitialBio(initialBioValue);

        if (mounted) {
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    previewUrlRef.current = newAvatarPreview;
  }, [newAvatarPreview]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!success) return;

    const timeout = setTimeout(() => {
      setSuccess(null);
    }, 5000);

    return () => clearTimeout(timeout);
  }, [success]);

  function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setSuccess(null);
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCropModalOpen(true);

    event.target.value = "";
  }

  function closeCropModal() {
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
    }
    setSelectedImage(null);
    setCroppedAreaPixels(null);
    setCropModalOpen(false);
  }

  async function handleCropDone() {
    if (!selectedImage || !croppedAreaPixels) {
      setError("Wybierz obszar zdjęcia i spróbuj ponownie.");
      return;
    }

    try {
      const blob = await getCroppedImg(selectedImage, croppedAreaPixels);

      if (newAvatarPreview) {
        URL.revokeObjectURL(newAvatarPreview);
      }

      const previewUrl = URL.createObjectURL(blob);
      setNewAvatarBlob(blob);
      setNewAvatarPreview(previewUrl);
    } catch {
      setError("Nie udało się przyciąć zdjęcia. Spróbuj ponownie.");
    } finally {
      closeCropModal();
    }
  }

  function handleCancel() {
    setUsername(initialUsername);
    setEmail(initialEmail);
    setBio(initialBio);

    if (newAvatarPreview) {
      URL.revokeObjectURL(newAvatarPreview);
    }
    setNewAvatarPreview(null);
    setNewAvatarBlob(null);

    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId) return;

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const trimmedBio = bio.trim();

    if (!trimmedUsername) {
      setError("Nazwa użytkownika nie może być pusta.");
      return;
    }

    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const supabase = createClient();

      let newAvatarUrl: string | null = null;

      if (newAvatarBlob) {
        const filePath = `${userId}/${Date.now()}.webp`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, newAvatarBlob, {
            contentType: "image/webp",
            cacheControl: "3600",
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        newAvatarUrl = urlData.publicUrl;
      }

      if (trimmedEmail !== initialEmail.trim()) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: trimmedEmail,
        });

        if (emailError) {
          throw new Error(emailError.message);
        }
      }

      const profilePayload: {
        id: string;
        username: string;
        avatar_url?: string;
        bio?: string;
      } = {
        id: userId,
        username: trimmedUsername,
        bio: trimmedBio,
      };

      if (newAvatarUrl) {
        profilePayload.avatar_url = newAvatarUrl;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(profilePayload, { onConflict: "id" });

      if (profileError) {
        throw new Error(profileError.message);
      }

      setSuccess("Zmiany zostały zapisane.");
      setSaving(false);

      setUsername(trimmedUsername);
      setEmail(trimmedEmail);
      setBio(trimmedBio);
      setInitialUsername(trimmedUsername);
      setInitialEmail(trimmedEmail);
      setInitialBio(trimmedBio);

      if (newAvatarUrl) {
        setCurrentAvatarUrl(newAvatarUrl);
      }

      if (newAvatarPreview) {
        URL.revokeObjectURL(newAvatarPreview);
      }
      setNewAvatarPreview(null);
      setNewAvatarBlob(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nie udało się zapisać zmian. Spróbuj ponownie.",
      );
      setSaving(false);
    }
  }

  const displayedAvatar = newAvatarPreview ?? currentAvatarUrl;
  const hasNewImage = newAvatarBlob !== null;
  const usernameChanged = username.trim() !== initialUsername.trim();
  const emailChanged = email.trim() !== initialEmail.trim();
  const bioChanged = bio.trim() !== initialBio.trim();
  const isDirty = hasNewImage || usernameChanged || emailChanged || bioChanged;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      {/* Zdjęcie profilowe */}
      <section className="flex flex-col items-center">
        {displayedAvatar ? (
          <img
            src={displayedAvatar}
            alt="Zdjęcie profilowe"
            className="h-32 w-32 rounded-full border border-neutral-800 object-cover"
          />
        ) : (
          <div className="flex h-32 w-32 items-center justify-center rounded-full border border-neutral-800 bg-neutral-800">
            <User className="h-14 w-14 text-neutral-500" />
          </div>
        )}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 text-sm font-medium text-purple-500 underline underline-offset-4 transition hover:text-purple-400"
        >
          {displayedAvatar
            ? "Zmień zdjęcie profilowe"
            : "Dodaj zdjęcie profilowe"}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </section>

      {/* Formularz */}
      <form onSubmit={handleSubmit} className="mt-10 space-y-6">

        <div className="space-y-2">
          <label htmlFor="bio" className="text-sm font-medium text-neutral-300">
            Biografia
          </label>
          <div className="relative">
            <Pen className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-neutral-500" />
            <textarea
              id="bio"
              rows={4}
              maxLength={BIO_MAX_LENGTH}
              value={bio}
              onChange={(event) => {
                setBio(event.target.value);
                setSuccess(null);
              }}
              placeholder="Opowiedz coś o sobie..."
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 p-3 pb-2 pl-11 text-white placeholder-neutral-500 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
            <span className="pointer-events-none absolute bottom-2 right-3 text-xs text-neutral-500">
              {bio.length}/{BIO_MAX_LENGTH}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="username" className="text-sm font-medium text-neutral-300">
            Nazwa użytkownika
          </label>
          <div className="relative">
            <Pen className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setSuccess(null);
              }}
              autoComplete="username"
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 p-3 pl-11 text-white placeholder-neutral-500 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-neutral-300">
            Adres E-mail
          </label>
          <div className="relative">
            <Pen className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setSuccess(null);
              }}
              autoComplete="email"
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 p-3 pl-11 text-white placeholder-neutral-500 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>



        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg border border-neutral-700 px-6 py-3 font-semibold text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
          >
            Anuluj
          </button>

          <button
            type="submit"
            disabled={!isDirty || saving}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <Loader2 className="h-5 w-5 animate-spin" />}
            {saving ? "Zapisywanie..." : "Zapisz zmiany"}
          </button>
        </div>
      </form>

      {cropModalOpen && selectedImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Przytnij zdjęcie</h2>
              <button
                type="button"
                onClick={closeCropModal}
                aria-label="Zamknij"
                className="rounded-md p-1 text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative h-72 w-full overflow-hidden rounded-lg bg-neutral-950">
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                minZoom={1}
                maxZoom={3}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, areaPixels) =>
                  setCroppedAreaPixels(areaPixels)
                }
              />
            </div>

            <div className="mt-4 flex items-center gap-3">
              <span className="text-xs text-neutral-500">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="flex-1 accent-purple-500"
              />
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeCropModal}
                className="rounded-lg border border-neutral-700 px-5 py-2 text-sm font-semibold text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={handleCropDone}
                className="rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
              >
                Gotowe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



