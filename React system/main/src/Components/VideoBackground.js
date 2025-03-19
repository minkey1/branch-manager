import React from "react";

const VideoBackground = ({ idleVideoRef, talkingVideoRef }) => {
  return (
    <>
      <video
        ref={idleVideoRef}
        id="idle-video"
        src="/idle.mp4"
        autoPlay
        loop
        muted
        className="video-background"
      />
      <video
        ref={talkingVideoRef}
        id="talking-video"
        src="/talking.mp4"
        loop
        muted
        className="video-background talking-video"
      />
    </>
  );
};

export default VideoBackground;
