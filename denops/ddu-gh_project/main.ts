import { Denops, ensure, is, JSONLinesParseStream, tomlParse } from "./deps.ts";
import {
  GHProjectTaskCreateResponse,
  isTaskCreate,
  isTaskEdit,
  TaskCreate,
  TaskEdit,
  TaskField,
  TaskFieldOption,
} from "./type/task.ts";
import { cmd, getGHCmd } from "./utils.ts";

/**
 * update target task status.
 * @param taskData target task data.
 */
async function updateTaskStatus<T extends TaskEdit | TaskCreate>(
  denops: Denops,
  taskData: T,
  taskId: string,
): Promise<void> {
  const ghCmd = await getGHCmd(denops);
  const statusField = taskData.taskFields.find((taskField) =>
    taskField.name === "Status"
  ) as TaskField;
  const currentStatusItem = statusField.options?.find((option) =>
    option.currentStatusFlag
  ) as TaskFieldOption;
  await cmd(denops, ghCmd, {
    args: [
      "project",
      "item-edit",
      "--id",
      taskId,
      "--project-id",
      taskData.projectId,
      "--field-id",
      statusField.id,
      "--single-select-option-id",
      currentStatusItem.id,
    ],
  });
}

export async function main(denops: Denops): Promise<void> {
  const ghCmd = await getGHCmd(denops);
  denops.dispatcher = {
    async edit(buflines: unknown): Promise<void> {
      const tomlString = ensure(buflines, is.ArrayOf(is.String)).join("\n");
      const taskData = ensure(tomlParse(tomlString), isTaskEdit);
      const editBaseArgs: string[] = [
        "project",
        "item-edit",
        "--id",
      ];
      if (taskData.taskType === "DraftIssue") {
        await cmd(denops, ghCmd, {
          args: [
            ...editBaseArgs,
            taskData.draftIssueID,
            "--title",
            taskData.title,
            "--body",
            taskData.body.join("\n"),
          ],
        });
      }
      for (const field of taskData.taskFields) {
        const editFieldArgs: string[] = [
          "--project-id",
          taskData.projectId,
          "--field-id",
          field.id,
        ];
        if (field.text) {
          await cmd(denops, ghCmd, {
            args: [
              ...editBaseArgs,
              taskData.taskId,
              ...editFieldArgs,
              "--text",
              field.text,
            ],
          });
        }
      }
      await updateTaskStatus(denops, taskData as TaskEdit, taskData.taskId);
      return await Promise.resolve();
    },
    async create(buflines: unknown): Promise<void> {
      const tomlString = ensure(buflines, is.ArrayOf(is.String)).join("\n");
      const taskData = ensure(tomlParse(tomlString), isTaskCreate);
      const { pipeOut, finalize } = await cmd(denops, ghCmd, {
        args: [
          "project",
          "item-create",
          taskData.projectNumber.toString(),
          "--owner",
          taskData.owner,
          "--title",
          taskData.title,
          "--body",
          taskData.body.join("\n"),
          "--format",
          "json",
        ],
      });

      let createResponse = {} as GHProjectTaskCreateResponse;
      await pipeOut
        .pipeThrough(new JSONLinesParseStream())
        .pipeTo(
          new WritableStream<GHProjectTaskCreateResponse>({
            write(response: GHProjectTaskCreateResponse) {
              createResponse = response;
            },
          }),
        );

      await updateTaskStatus(denops, taskData as TaskCreate, createResponse.id);
      await finalize();

      return await Promise.resolve();
    },
  };

  return Promise.resolve();
}
