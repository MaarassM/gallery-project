//TanStack Form interno koristi Observer pattern - polja forme se pretplaćuju
// na stanje i automatski se re-renderiraju kad se vrijednosti promijene.
// Svako `form.Field` je "observer" koji sluša promjene na svom dijelu stanja.

import { useState } from "react";
import {
  Paper,
  Stack,
  TextInput,
  Textarea,
  FileButton,
  Button,
  Group,
  Text,
  Image,
  NumberInput,
  Select,
  Checkbox,
  Alert,
  Progress,
} from "@mantine/core";
import { useForm } from "@tanstack/react-form";
import { valibotValidator } from "@tanstack/valibot-form-adapter";
import * as v from "valibot";
import { notifications } from "@mantine/notifications";

interface PhotoUploaderProps {
  onSuccess?: () => void;
}

export function PhotoUploader({ onSuccess }: PhotoUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      hashtags: "",
      enableResize: false,
      resizeWidth: 1920,
      resizeHeight: 1080,
      resizeFit: "cover" as "cover" | "contain",
      format: "original" as "jpg" | "png" | "bmp" | "webp" | "original",
      quality: 90,
    },
    onSubmit: async ({ value }) => {
      if (!file) {
        notifications.show({
          title: "Error",
          message: "Please select a file to upload",
          color: "red",
        });
        return;
      }

      setUploading(true);
      setProgress(10);

      try {
        // Build processing options
        const processingOptions: any = {};

        if (value.enableResize) {
          processingOptions.resize = {
            width: value.resizeWidth,
            height: value.resizeHeight,
            fit: value.resizeFit,
          };
        }

        if (value.format !== "original") {
          processingOptions.format = value.format;
          processingOptions.quality = value.quality;
        }

        setProgress(30);

        // Upload via fetch to /api/photos/upload
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", value.title);
        formData.append("description", value.description);
        formData.append("hashtags", value.hashtags);
        formData.append("processingOptions", JSON.stringify(processingOptions));

        setProgress(50);

        const response = await fetch("/api/photos/upload", {
          method: "POST",
          body: formData,
          credentials: "include", // Include session cookie
        });

        setProgress(80);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Upload failed");
        }

        const result = await response.json();
        setProgress(100);

        notifications.show({
          title: "Success",
          message: "Photo uploaded successfully!",
          color: "green",
        });

        // Reset form
        setFile(null);
        setPreview(null);
        form.reset();
        onSuccess?.();
      } catch (error) {
        notifications.show({
          title: "Upload Failed",
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
          color: "red",
        });
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    validatorAdapter: valibotValidator(),
  });

  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);

    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  return (
    <Paper shadow="sm" p="lg" radius="md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <Stack gap="md">
          <Text size="lg" fw={600}>
            Upload Photo
          </Text>

          {/* File Selection */}
          <Stack gap="xs">
            <FileButton
              onChange={handleFileChange}
              accept="image/png,image/jpeg,image/bmp,image/webp"
            >
              {(props) => (
                <Button {...props} variant="light" disabled={uploading}>
                  {file ? "Change File" : "Select File"}
                </Button>
              )}
            </FileButton>

            {file && (
              <Alert color="blue" variant="light">
                <Text size="sm" fw={500}>
                  {file.name}
                </Text>
                <Text size="xs" c="dimmed">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </Text>
              </Alert>
            )}

            {preview && (
              <Image
                src={preview}
                alt="Preview"
                height={200}
                fit="contain"
                radius="md"
              />
            )}
          </Stack>

          {/* Title */}
          <form.Field name="title">
            {(field) => (
              <TextInput
                label="Title (optional)"
                placeholder="Enter photo title"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                error={field.state.meta.errors[0]}
                disabled={uploading}
              />
            )}
          </form.Field>

          {/* Description */}
          <form.Field name="description">
            {(field) => (
              <Textarea
                label="Description (optional)"
                placeholder="Enter photo description"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                error={field.state.meta.errors[0]}
                rows={3}
                disabled={uploading}
              />
            )}
          </form.Field>

          {/* Hashtags */}
          <form.Field name="hashtags">
            {(field) => (
              <TextInput
                label="Hashtags (optional)"
                placeholder="nature, sunset, photography"
                description="Separate tags with commas"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                disabled={uploading}
              />
            )}
          </form.Field>

          {/* Processing Options */}
          <Stack gap="xs">
            <Text size="sm" fw={600}>
              Processing Options
            </Text>

            {/* Enable Resize */}
            <form.Field name="enableResize">
              {(field) => (
                <Checkbox
                  label="Resize image"
                  checked={field.state.value}
                  onChange={(e) => field.handleChange(e.currentTarget.checked)}
                  disabled={uploading}
                />
              )}
            </form.Field>

            {/* Resize Options */}
            <form.Field name="enableResize">
              {(field) =>
                field.state.value && (
                  <Group grow>
                    <form.Field name="resizeWidth">
                      {(widthField) => (
                        <NumberInput
                          label="Width"
                          placeholder="1920"
                          value={widthField.state.value}
                          onChange={(val) =>
                            widthField.handleChange(Number(val))
                          }
                          min={100}
                          max={4000}
                          disabled={uploading}
                        />
                      )}
                    </form.Field>

                    <form.Field name="resizeHeight">
                      {(heightField) => (
                        <NumberInput
                          label="Height"
                          placeholder="1080"
                          value={heightField.state.value}
                          onChange={(val) =>
                            heightField.handleChange(Number(val))
                          }
                          min={100}
                          max={4000}
                          disabled={uploading}
                        />
                      )}
                    </form.Field>

                    <form.Field name="resizeFit">
                      {(fitField) => (
                        <Select
                          label="Fit"
                          data={[
                            { value: "cover", label: "Cover" },
                            { value: "contain", label: "Contain" },
                          ]}
                          value={fitField.state.value}
                          onChange={(val) =>
                            fitField.handleChange(val as "cover" | "contain")
                          }
                          disabled={uploading}
                        />
                      )}
                    </form.Field>
                  </Group>
                )
              }
            </form.Field>

            {/* Format Conversion */}
            <Group grow>
              <form.Field name="format">
                {(field) => (
                  <Select
                    label="Format"
                    data={[
                      { value: "original", label: "Keep Original" },
                      { value: "jpg", label: "JPG" },
                      { value: "png", label: "PNG" },
                      { value: "bmp", label: "BMP" },
                      { value: "webp", label: "WebP" },
                    ]}
                    value={field.state.value}
                    onChange={(val) =>
                      field.handleChange(
                        val as "jpg" | "png" | "bmp" | "webp" | "original",
                      )
                    }
                    disabled={uploading}
                  />
                )}
              </form.Field>

              <form.Field name="quality">
                {(field) => (
                  <NumberInput
                    label="Quality"
                    placeholder="90"
                    description="1-100 (only for JPG/WebP)"
                    value={field.state.value}
                    onChange={(val) => field.handleChange(Number(val))}
                    min={1}
                    max={100}
                    disabled={uploading}
                  />
                )}
              </form.Field>
            </Group>
          </Stack>

          {/* Upload Progress */}
          {uploading && (
            <Stack gap="xs">
              <Progress value={progress} animated />
              <Text size="sm" c="dimmed" ta="center">
                Uploading... {progress}%
              </Text>
            </Stack>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!file || uploading}
            loading={uploading}
          >
            Upload Photo
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}
