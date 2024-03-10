import { is } from "https://deno.land/x/unknownutil@v3.17.0/mod.ts";

export type TaskFieldOption = {
  id: string;
  name: string;
  currentStatusFlag?: boolean;
};

export type TaskField = {
  id: string;
  name: string;
  text?: string;
  options?: TaskFieldOption[];
};

export const isTaskFieldOption = is.ObjectOf({
  id: is.String,
  name: is.String,
  currentStatusFlag: is.OptionalOf(is.Boolean),
});

export const isTaskField = is.ObjectOf({
  id: is.String,
  name: is.String,
  text: is.OptionalOf(is.String),
  options: is.OptionalOf(is.ArrayOf(isTaskFieldOption)),
});

export type TaskEdit = {
  projectId: string;
  taskId: string;
  title: string;
  body: string[];
  currentStatus: string;
  taskFields: TaskField[];
};

export const isTaskEdit = is.ObjectOf({
  projectId: is.String,
  taskId: is.String,
  title: is.String,
  body: is.ArrayOf(is.String),
  currentStatus: is.String,
  taskFields: is.ArrayOf(isTaskField),
});

export type KindActionData = {
  projectId: string;
  taskId: string;
  title: string;
  body: string;
  currentStatus: string;
  type: "DraftIssue" | "Issue" | "PullRequest";
  fields: GHProjectTaskField[];
};

export type SourceParams = {
  cmd: string;
  owner: string;
  limit: number;
  projectId?: string;
  projectNumber?: number;
};

/**
 * Type of each task which can be obtained by `gh project item-list --format json`
 */
export type GHProjectTask = {
  id: string;
  status: string;
  title: string;
  content: GHProjectTaskContent;
  assignees?: string[];
  repository?: string;
};

export type GHProjectTaskContent = {
  title: string;
  body: string;
  type:
    | "DraftIssue"
    | "Issue"
    | "PullRequest";
  number?: number;
  repository?: string;
  url?: string;
  id?: string;
};

export type GHProjectTaskField = {
  id: string;
  name: string;
  type: string;
  options?: GHProjectTaskSingleSelectField[];
};

export type GHProjectTaskSingleSelectField = {
  id: string;
  name: string;
};

/**
 * autoload/ddu_source_gh_project#create_scratch_buffer
 * Return value type of buffer creation function
 */
export type BufInfo = {
  bufnr: number;
  bufname: string;
};
