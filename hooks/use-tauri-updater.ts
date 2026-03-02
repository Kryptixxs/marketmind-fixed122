"use client";

import { useEffect } from 'react';
import { checkUpdate, installUpdate, onUpdaterEvent } from '@tauri-apps/api/updater';
import { relaunch } from '@tauri-apps/api/process';
import { isTauri } from '@/lib/tauri';

export function useTauriUpdater() {
  useEffect(() => {
    if (!isTauri()) return;

    const checkAndInstall = async () => {
      try {
        const { shouldUpdate, manifest } = await checkUpdate();
        if (shouldUpdate) {
          console.log(`Installing update ${manifest?.version}...`);
          await installUpdate();
          await relaunch();
        }
      } catch (error) {
        console.error('Failed to check for updates:', error);
      }
    };

    checkAndInstall();

    // Listen for updater events
    const unlisten = onUpdaterEvent(({ error, status }) => {
      console.log('Updater event:', status, error);
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, []);
}