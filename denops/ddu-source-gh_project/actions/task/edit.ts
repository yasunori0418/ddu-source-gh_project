import {
  ActionArguments,
  ActionFlags,
} from "https://deno.land/x/ddu_vim@v3.10.2/types.ts";
import {
  autocmd,
  Denops,
  fn,
} from "https://deno.land/x/ddu_vim@v3.10.2/deps.ts";
import { stringify as tomlStringify } from "https://deno.land/std@0.218.2/toml/mod.ts";
import { KindParams as Params } from "../../type/common.ts";
import {
  BufInfo,
  KindActionData as ActionData,
  TaskEdit,
  TaskField,
} from "../../type/task.ts";

function defineAutocmd(
  denops: Denops,
  bufnr: number,
  ctx: string,
) {
  autocmd.define(denops, "QuitPre", `<buffer=${bufnr}>`, ctx, {
    once: true,
  });
}

function createTomlData(action: ActionData): string[] {
  const task: TaskEdit = {
    projectId: action.projectId,
    taskId: action.taskId,
    title: action.title,
    body: action.body.split(/\n/),
    currentStatus: action.currentStatus,
    taskFields: [],
  };

  for (const field of action.fields) {
    const taskField: TaskField = {
      id: field.id,
      name: field.name,
    };
    if (!field.options) taskField.text = "";
    if (field.options) {
      taskField.options = [];
      for (const option of field.options) {
        let currentStatusFlag = undefined;
        if (field.name === "Status" && option.name === action.currentStatus) {
          currentStatusFlag = true;
        }
        taskField.options.push({
          id: option.id,
          name: option.name,
          currentStatusFlag,
        });
      }
    }
    task.taskFields.push(taskField);
  }

  return tomlStringify(task).split(/\n/);
}

export async function edit(args: ActionArguments<Params>) {
  const denops = args.denops;
  const action = args.items[0].action as ActionData;
  const { bufnr, bufname } = await denops.call(
    "ddu_source_gh_project#create_scratch_buffer",
    action.taskId,
  ) as BufInfo;
  await fn.appendbufline(denops, bufname, 0, createTomlData(action));

  defineAutocmd(denops, bufnr, `call ddu_source_gh_project#send(${bufnr})`);

  denops.call(
    "ddu_source_gh_project#open_buffer",
    bufnr,
    "horizontal",
  ) as Promise<void>;
  return Promise.resolve(ActionFlags.None);
}