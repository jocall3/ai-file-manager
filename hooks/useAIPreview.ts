import { useState, useEffect } from 'react';
import type { FileNode } from '../types';
import { generatePreview } from '../services/geminiService';
import { readFileContent } from '../services/fileSystemService';

const isPreviewableFile = (fileName: string) => {
    const textExtensions = ['.txt', '.md', '.json', '.js', '.ts', '.tsx', '.html', '.css', '.py'];
    return textExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
};

export const useAIPreview = (file: FileNode, isHovered: boolean) => {
    const [preview, setPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // FIX: Replaced NodeJS.Timeout with ReturnType<typeof setTimeout> for browser compatibility.
        let timeoutId: ReturnType<typeof setTimeout>;
        let isCancelled = false;

        const fetchPreview = async () => {
            if (isCancelled || !isPreviewableFile(file.name) || file.isDirectory) {
                return;
            }

            setIsLoading(true);
            setPreview(null);
            setError(null);

            try {
                const content = await readFileContent(file.handle as FileSystemFileHandle);
                if (isCancelled) return;
                
                const summary = await generatePreview(file.name, content);
                 if (isCancelled) return;
                
                setPreview(summary);
            } catch (e) {
                 if (isCancelled) return;
                setError(e instanceof Error ? e.message : 'Failed to get preview');
            } finally {
                 if (!isCancelled) setIsLoading(false);
            }
        };

        if (isHovered) {
            timeoutId = setTimeout(fetchPreview, 500); // Debounce to avoid spamming API on quick hovers
        }

        return () => {
            isCancelled = true;
            clearTimeout(timeoutId);
            setIsLoading(false);
            setPreview(null); // Reset on un-hover
        };
    }, [file, isHovered]);

    return { preview, isLoading, error };
};
