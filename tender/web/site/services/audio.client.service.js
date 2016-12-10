/**
 * Created by Wayne on 15/5/26.
 */
'use strict';

tender.service('AudioPlayer', [function () {
  return function (audioPath, callback) {
    var audioStatus = {
      unknown: 'unknown',
      loaded: 'loaded',
      playing: 'playing',
      stoped: 'stoped',
      error: 'error'
    };

    this.duration = 0;
    this.currentTime = 0;
    this.status = audioStatus.unknown;
    var mirrorThis = this; //this对象的镜像，用于函数类的赋值，防止闭包。

    var audio = null;

    if (window.Audio) {
      audio = new Audio();

      audio.addEventListener('error', function () {
        mirrorThis.status = audioStatus.error;

        if (callback)
          callback('error', mirrorThis.status);
      });

      audio.addEventListener('canplaythrough', function () { //可以完整播放时，所有帧下载完毕
        mirrorThis.status = audioStatus.loaded;
        if (audio.duration)
          mirrorThis.duration = Math.ceil(audio.duration); //向上取整

        if (callback)
          callback('loaded', mirrorThis.status);
      });

      audio.addEventListener('ended', function () {
        audio.currentTime = 0;
        mirrorThis.status = audioStatus.stoped;
        if (callback)
          callback('ended', mirrorThis.status);
      });
    }
    else {
      mirrorThis.status = audioStatus.error;
      if (callback)
        callback('error', mirrorThis.status);
    }
    this.setVolume = function (volume) {
      if (mirrorThis.status !== audioStatus.error && mirrorThis.status !== audioStatus.unknown) {
        if (volume < 0) {
          volume = 0;
        }
        if (volume > 1) {
          volume = 1;
        }

        audio.volume = volume;
      }
    };

    this.play = function () {
      if (mirrorThis.status !== audioStatus.error && mirrorThis.status !== audioStatus.unknown) {
        if (mirrorThis.status !== audioStatus.playing) {
          audio.play();
        }
        mirrorThis.status = audioStatus.playing;
        callback('playing', audioStatus.playing);
      }
    };

    this.stop = function () {
      if (mirrorThis.status !== audioStatus.error && mirrorThis.status !== audioStatus.unknown) {
        if (mirrorThis.status !== audioStatus.stoped) {
          audio.pause();
          audio.currentTime = 0;
        }

        mirrorThis.status = audioStatus.stoped;
      }
    };

    this.close = function () {
      if (audio) {
        audio.pause();
        audio = null;
        mirrorThis.status = audioStatus.unknown;
      }
    };

    //bug fix for chrome;
    setTimeout(function () {
      if (audio)
        audio.src = audioPath;
    }, 1);

  };
}]);