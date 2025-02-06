import { Component, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-video',
  standalone: false,
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.css']
})
export class VideoComponent {
  sentences: any[] = []; // To store sentences fetched from the file
  currentSentenceIndex = 0;
  progress = 0;
  interval: any;
  isRecording = false;
  isPaused = false;
  currentProgress = 0;
  currentVideoTime = 0;
  @ViewChild('videoPlayer', { static: false }) videoPlayer: any;

  // Audio Recording Variables
  mediaRecorder: any;
  audioChunks: Blob[] = [];
  audioChunksList: Blob[] = []; // Stores all paused audio chunks
  audioBlob: Blob | null = null;
  audioUrl: string | null = null;
  audioFileName: string = ""; // Dynamically set this based on video file name

  currentVideoSrc: string = 'assets/sample-video.mp4';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.isRecording = false;
    this.isPaused = false;
    this.setAudioFileNameFromVideo();
    this.loadSentences();
  }

  titles = [
    'Title 1: Introduction',
    'Title 2: Chapter 1',
    'Title 3: Chapter 2',
    'Title 4: Chapter 3',
    'Title 5: Conclusion'
  ];
  // Fetch sentences from the text file in the assets folder
  loadSentences() {
    this.http.get<any[]>('assets/data.txt').subscribe(
      (data) => {
        this.sentences = data;
        console.log('Sentences loaded:', this.sentences);
      },
      (error) => {
        console.error('Error loading sentences:', error);
      }
    );
  }

  setAudioFileNameFromVideo() {
    const videoSrc = "assets/sample-video.mp4"; // The actual video URL or source
    const videoFileName = videoSrc.split('/').pop()?.split('.').shift(); // Extract file name without extension
    if (videoFileName) {
      this.audioFileName = `${videoFileName}.wav`; // Set audio file name based on video
    }
  }

  toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  startRecording() {
    this.isRecording = true;
    this.isPaused = false;

    this.startHighlighting();
    this.playVideo();
    this.startVoiceRecording();
  }

  stopRecording() {
    this.isRecording = false;
    this.stopHighlighting();
    this.pauseVideo();
    this.stopVoiceRecording();
  }

  startVoiceRecording() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        this.mediaRecorder = new MediaRecorder(stream);

        this.mediaRecorder.ondataavailable = (event: { data: Blob }) => {
          if (!this.isPaused) {
            this.audioChunks.push(event.data);
          }
        };

        this.mediaRecorder.onstop = () => {
          const chunkBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
          this.audioChunksList.push(chunkBlob); // Store each recording session
          this.audioChunks = []; // Clear for next recording session
        };

        this.mediaRecorder.start();
      }).catch(err => {
        console.error('Error accessing microphone', err);
      });
    } else {
      console.error('MediaRecorder API is not supported in this browser.');
    }
  }

  stopVoiceRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  pauseVoiceRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop(); // Stop and store the current chunk
    }
    this.isPaused = true;
  }

  resumeVoiceRecording() {
    if (this.isPaused) {
      this.startVoiceRecording(); // Start a new recording session
      this.isPaused = false;
    }
  }

  mergeAudioAndDownload() {
    if (this.audioChunksList.length === 0) {
      console.error("No audio to merge.");
      return;
    }

    // Merge all recorded chunks
    this.audioBlob = new Blob(this.audioChunksList, { type: 'audio/wav' });
    this.audioUrl = URL.createObjectURL(this.audioBlob);

    // Trigger download with dynamically set audio file name
    const link = document.createElement('a');
    link.href = this.audioUrl;
    link.download = this.audioFileName; // Download with the video file name as the audio file name
    link.click();
  }

  startHighlighting() {
    if (this.currentSentenceIndex === 0 && this.currentProgress === 0) {
      this.highlightSentence();
    } else {
      this.resumeHighlighting();
    }
  }

  stopHighlighting() {
    clearInterval(this.interval);
    this.currentProgress = this.progress;
    this.currentSentenceIndex = this.currentSentenceIndex;
  }

  resumeHighlighting() {
    const sentence = this.sentences[this.currentSentenceIndex];
    const duration = (sentence.end - sentence.start) * 1000;

    this.progress = this.currentProgress;
    clearInterval(this.interval);

    this.interval = setInterval(() => {
      this.progress += 100 / (duration / 100);

      if (this.progress >= 100) {
        clearInterval(this.interval);
        this.progress = 100;
        setTimeout(() => {
          this.currentSentenceIndex++;
          if (this.currentSentenceIndex < this.sentences.length) {
            this.highlightSentence();
          }
        }, 500);
      }
    }, 100);
  }

  playVideo() {
    if (this.videoPlayer?.nativeElement) {
      if (this.currentVideoTime > 0) {
        this.videoPlayer.nativeElement.currentTime = this.currentVideoTime;
      }
      this.videoPlayer.nativeElement.play();
      this.videoPlayer.nativeElement.muted = true;
    }
  }

  pauseVideo() {
    if (this.videoPlayer?.nativeElement) {
      this.currentVideoTime = this.videoPlayer.nativeElement.currentTime;
      this.videoPlayer.nativeElement.pause();
    }
  }

  pauseAll() {
    this.pauseVideo();
    this.pauseVoiceRecording();
    this.stopHighlighting();
  }

  resumeAll() {
    this.playVideo();
    this.resumeVoiceRecording();
    this.startHighlighting();
  }



  highlightSentence() {
    if (this.currentSentenceIndex >= this.sentences.length) return;

    const sentence = this.sentences[this.currentSentenceIndex];
    const duration = (sentence.end - sentence.start) * 1000;

    this.progress = 0;
    clearInterval(this.interval);

    this.interval = setInterval(() => {
      this.progress += 100 / (duration / 100);

      if (this.progress >= 100) {
        clearInterval(this.interval);
        this.progress = 100;
        setTimeout(() => {
          this.currentSentenceIndex++;
          if (this.currentSentenceIndex < this.sentences.length) {
            this.highlightSentence();
          }
        }, 500);
      }
    }, 100);
  }
}
