export class Clip {

    static fromUrl(source: string) {
        return new Clip(source);
    }

    private htmlAudio: HTMLAudioElement;

    private constructor(private source: string) {
        this.htmlAudio = new Audio(source);
    }

    play(): Promise<void> {
        return this.htmlAudio.play();
    }

    pause() {
        this.htmlAudio.pause();
    }

    stop() {
        this.pause();
        this.htmlAudio.currentTime = 0;
    }
}
