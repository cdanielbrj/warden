import { cp, mkdir, stat } from "node:fs/promises";
import { basename, join } from "node:path";

export interface BackupCopyRequest {
  readonly category: string;
  readonly name: string;
  readonly sourcePath: string;
  readonly recursive?: boolean;
  readonly filter?: (source: string, destination: string) => boolean | Promise<boolean>;
}

export interface StoredBackup {
  readonly path: string;
}

export class BackupStorageService {
  constructor(private readonly backupRoot: string) {}

  async copy(request: BackupCopyRequest): Promise<StoredBackup> {
    validatePathSegment(request.category, "backup category");
    validatePathSegment(request.name, "backup name");

    const backupDirectory = await this.createBackupDirectory(request.category);
    const backupPath = join(backupDirectory, request.name);

    try {
      await cp(request.sourcePath, backupPath, {
        errorOnExist: true,
        filter: request.filter,
        force: false,
        preserveTimestamps: true,
        recursive: request.recursive,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Unable to copy backup source: ${message}`);
    }

    return { path: `${request.category}/${request.name}` };
  }

  private async createBackupDirectory(category: string): Promise<string> {
    try {
      const backupRoot = await stat(this.backupRoot);
      if (!backupRoot.isDirectory()) {
        throw new Error("Backup root is not a directory.");
      }

      const backupDirectory = join(this.backupRoot, category);
      await mkdir(backupDirectory, { recursive: true });
      return backupDirectory;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Unable to access backup directory: ${message}`);
    }
  }
}

function validatePathSegment(value: string, label: string): void {
  if (!value || basename(value) !== value || value === "." || value === "..") {
    throw new Error(`Invalid ${label}.`);
  }
}
