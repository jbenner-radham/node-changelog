declare module 'hosted-git-info' {
  import hostedGitInfo, { type GitHost, type Options } from 'hosted-git-info';

  export default hostedGitInfo;

  export function fromManifest(
    manifest: { repository: string | { type: string; url: string; directory?: string } },
    options?: Options
  ): GitHost | undefined;
}
