import { wordsAudioURL, backupAudioURL } from '$data/websiteSettings.js';

export class AudioPlayer {
    constructor() {
        this.currentAudio = null;
        this.isPlaying = false;
    }
    
    // Generate R2 audio URL with fallback
    getAudioUrl(chapter, verse, word, usePrimary = true) {
        const baseUrl = usePrimary ? wordsAudioURL : backupAudioURL;
        const chapterPadded = chapter.toString().padStart(3, '0');
        const versePadded = verse.toString().padStart(3, '0');
        const wordPadded = word.toString().padStart(3, '0');
        
        return `${baseUrl}/${chapterPadded}/${versePadded}/${wordPadded}.mp3`;
    }
    
    // Play audio with automatic fallback
    async playWord(chapter, verse, word) {
        try {
            // Stop current audio if playing
            if (this.currentAudio) {
                this.currentAudio.pause();
            }
            
            // Try primary URL (your R2)
            const primaryUrl = this.getAudioUrl(chapter, verse, word, true);
            
            this.currentAudio = new Audio(primaryUrl);
            this.currentAudio.preload = 'none';
            
            // Set up error handling for fallback
            this.currentAudio.addEventListener('error', async () => {
                console.warn('Primary audio failed, trying backup...');
                
                const backupUrl = this.getAudioUrl(chapter, verse, word, false);
                this.currentAudio.src = backupUrl;
                
                try {
                    await this.currentAudio.play();
                } catch (error) {
                    console.error('Both audio sources failed:', error);
                }
            });
            
            // Play the audio
            await this.currentAudio.play();
            this.isPlaying = true;
            
            // Reset playing state when audio ends
            this.currentAudio.addEventListener('ended', () => {
                this.isPlaying = false;
            });
            
        } catch (error) {
            console.error('Audio playback failed:', error);
            this.isPlaying = false;
        }
    }
    
    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.isPlaying = false;
        }
    }
}

// Export singleton instance
export const audioPlayer = new AudioPlayer();