import { supabase } from '../dbService/supabase';

export const MAGAZINE_BUCKET = 'magazines';
export const CURRENT_MAGAZINE_PATH = 'current-month.pdf';

/**
 * Uploads a PDF file to the 'magazines' bucket, overwriting the 'current-month.pdf'
 * This ensures only one current magazine exists.
 */
export const uploadMagazinePDF = async (file: File): Promise<{ error: any; publicUrl: string | null }> => {
  try {
    // 1. Upload/Overwrite the file
    const { error: uploadError } = await supabase.storage
      .from(MAGAZINE_BUCKET)
      .upload(CURRENT_MAGAZINE_PATH, file, {
        upsert: true,
        contentType: 'application/pdf',
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Error uploading magazine:', uploadError);
      return { error: uploadError, publicUrl: null };
    }

    // 2. Get Public URL
    const { data } = supabase.storage
      .from(MAGAZINE_BUCKET)
      .getPublicUrl(CURRENT_MAGAZINE_PATH);

    // Append timestamp to bust cache
    const publicUrl = `${data.publicUrl}?t=${new Date().getTime()}`;
    
    return { error: null, publicUrl };

  } catch (err) {
    console.error('Unexpected error in uploadMagazinePDF:', err);
    return { error: err, publicUrl: null };
  }
};

/**
 * Gets the public URL for the current magazine PDF.
 */
export const getMagazineUrl = (): string => {
  const { data } = supabase.storage
    .from(MAGAZINE_BUCKET)
    .getPublicUrl(CURRENT_MAGAZINE_PATH);
    
  // We don't append timestamp here by default to leverage browser caching, 
  // but specific views might want to.
  return data.publicUrl;
};
