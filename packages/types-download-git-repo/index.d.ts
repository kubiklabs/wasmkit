declare module "download-git-repo" {
  export default function download (
    url: string,
    dir: string,
    opts: { clone: boolean },
    callback: (error: Error | undefined) => void
  ): Promise<any>;
}
