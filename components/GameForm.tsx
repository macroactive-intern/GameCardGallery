"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";

import {
  createGameAction,
  updateGameAction,
} from "@/actions/games";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createGameSchema,
  updateGameSchema,
  type Game,
} from "@/lib/gameSchema";

type CreateGameFormValues = z.infer<typeof createGameSchema>;
type UpdateGameFormValues = z.infer<typeof updateGameSchema>;
type CreateGameFormInput = z.input<typeof createGameSchema>;
type UpdateGameFormInput = z.input<typeof updateGameSchema>;
type GameFormValues = CreateGameFormValues | UpdateGameFormValues;
type GameFormInput = CreateGameFormInput | UpdateGameFormInput;

type GameFormProps =
  | {
      mode: "create";
      game?: never;
    }
  | {
      mode: "edit";
      game: Game;
    };

function getCurrentYear() {
  return new Date().getFullYear();
}

function getDefaultValues(game?: Game): GameFormInput {
  return {
    title: game?.title ?? "",
    platform: game?.platform ?? "",
    genre: game?.genre ?? "",
    tags: game?.tags ?? [],
    rating: game?.rating ?? 1,
    releaseYear: game?.releaseYear ?? getCurrentYear(),
    coverUrl: game?.coverUrl ?? "",
    description: game?.description ?? "",
    featured: game?.featured ?? false,
  };
}

function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function GameForm({ mode, game }: GameFormProps) {
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const isEditMode = mode === "edit";
  const resolver = zodResolver(
    isEditMode ? updateGameSchema : createGameSchema,
  ) as Resolver<GameFormInput, unknown, GameFormValues>;

  const form = useForm<GameFormInput, unknown, GameFormValues>({
    resolver,
    defaultValues: getDefaultValues(game),
  });

  async function onSubmit(values: GameFormValues) {
    setActionMessage(null);

    const result = isEditMode
      ? await updateGameAction(game.slug, values)
      : await createGameAction(values);

    if ("error" in result) {
      setActionMessage(result.error);
      return;
    }

    setActionMessage(isEditMode ? "Game updated." : "Game created.");

    if (!isEditMode) {
      form.reset(getDefaultValues());
    }
  }

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        {isEditMode ? (
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="text-sm font-medium">Slug</p>
            <p className="mt-1 text-sm text-muted-foreground">{game.slug}</p>
          </div>
        ) : null}

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Astral Forge" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="platform"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Platform</FormLabel>
                <FormControl>
                  <Input placeholder="PC" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="genre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Genre</FormLabel>
                <FormControl>
                  <Input placeholder="Strategy" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="coverUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cover URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://picsum.photos/seed/game/800/600" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rating</FormLabel>
                <FormControl>
                  <Input
                    max={10}
                    min={1}
                    step={0.1}
                    type="number"
                    {...field}
                    onChange={(event) => field.onChange(event.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="releaseYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Release year</FormLabel>
                <FormControl>
                  <Input
                    max={getCurrentYear()}
                    min={1970}
                    step={1}
                    type="number"
                    {...field}
                    onChange={(event) => field.onChange(event.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <Input
                  placeholder="space, tactical, base-building"
                  value={field.value?.join(", ") ?? ""}
                  onBlur={field.onBlur}
                  onChange={(event) => field.onChange(parseTags(event.target.value))}
                  ref={field.ref}
                />
              </FormControl>
              <FormDescription>
                Separate tags with commas. Up to 8 tags.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea rows={5} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="featured"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start gap-3 rounded-lg border p-4">
              <FormControl>
                <Checkbox
                  checked={Boolean(field.value)}
                  onBlur={field.onBlur}
                  onCheckedChange={field.onChange}
                  ref={field.ref}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Featured game</FormLabel>
                <FormDescription>
                  Featured games appear first in the gallery.
                </FormDescription>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {actionMessage ? (
          <p className="text-sm text-muted-foreground">{actionMessage}</p>
        ) : null}

        <Button disabled={form.formState.isSubmitting} type="submit">
          {form.formState.isSubmitting
            ? "Saving..."
            : isEditMode
              ? "Update game"
              : "Create game"}
        </Button>
      </form>
    </Form>
  );
}
