"use client";

import { useEffect } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { isTauri } from '@/lib/tauri';

export function useTauriUpdater() {
  useEffect(() => {
    if (!isTauri()) return;

    const checkAndInstall = async () => {
      try {
        const update = await check();
        if (update) {
          console.log(`Installing update ${update.version}...`);
          await update.downloadAndInstall();
          await relaunch();
        }
      } catch (error) {
        console.error('Failed to check for updates:', error);
      }
    };

    checkAndInstall();
  }, []);
}