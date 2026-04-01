import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';

export function useUploadFile() {
    return useMutation({
        mutationFn: async ({ file, folder }: { file: File; folder?: string }) => {
            const formData = new FormData();
            formData.append('file', file);
            if (folder) {
                formData.append('folder', folder);
            }
            const res = await api.post('/storage/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            // res.data.fileUrl should contain the returned URL
            return res.data;
        },
    });
}
