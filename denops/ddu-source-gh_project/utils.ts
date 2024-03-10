/**
 * Type functions that override certain properties
 * Reference: https://qiita.com/ibaragi/items/2a6412aeaca5703694b1
 */
export type Overwrite<T, U extends { [Key in keyof T]?: unknown }> =
  & Omit<
    T,
    keyof U
  >
  & U;

/**
 * Reference: https://github.com/kyoh86/denops-util/blob/622d3b7/command.ts#L36
 */
export function cmd(
  command: string | URL,
  options?: Omit<Deno.CommandOptions, "stdin" | "stderr" | "stdout">,
) {
  const { stdout } = new Deno.Command(command, {
    ...options,
    stdin: "null",
    stderr: "null",
    stdout: "piped",
  }).spawn();

  return {
    pipeOut: stdout.pipeThrough(new TextDecoderStream()),
    finalize: async () => {
      await stdout.cancel();
    },
  };
}
