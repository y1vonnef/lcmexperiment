"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import * as fal from "@fal-ai/serverless-client";
// import {
//   Excalidraw,
//   exportToBlob,
//   serializeAsJSON,
// } from "@excalidraw/excalidraw";
import "aframe";

fal.config({
  proxyUrl: "/api/fal/proxy",
});
//for consistent image output
const seed = Math.floor(Math.random() * 100000);
const baseArgs = {
  sync_mode: true,
  strength: 0.99,
  seed,
};

export default function Home() {
  // const [input, setInput] = useState(
  //   "a magical world of black and green crystals"
  // );

  const [inputs, setInputs] = useState([
    { id: 1, value: "a magical world of black and green crystals" },
  ]);
  const [nextId, setNextId] = useState(2);

  const [image, setImage] = useState(null);
  const [sourceImg, setSourceImg] = useState(null);
  const [sceneData, setSceneData] = useState(null);
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [_appState, setAppState] = useState(null); //this is excalidraw app state

  const inputRef = useRef(inputs);

  useEffect(() => {
    inputRef.current = inputs; // Update the ref whenever the input state changes
  }, [inputs]);

  //uses websockets
  const { send } = fal.realtime.connect("110602490-sdxl-turbo-realtime", {
    connectionKey: "realtime-nextjs-app-1",
    onResult(result) {
      if (result.error) return; //if there's error, don't do anything and just return
      console.log("ive made the CALL");
      setImage(result.images[0].url);
      //console.log(result.images[0].url);
    },
  });

  function captureImage(videoElement) {
    const canvas = document.createElement("canvas");
    const margin = 300; // Margin from the edges of the screen
    const sourceX = margin; // Starting X position in the source video
    const sourceY = margin - 150; // Starting Y position in the source video
    const sourceWidth = videoElement.videoWidth - 2.5 * margin; // Width of the source rectangle
    const sourceHeight = videoElement.videoHeight - margin; // Height of the source rectangle

    canvas.width = sourceWidth;
    canvas.height = sourceHeight;
    const ctx = canvas.getContext("2d");

    setInterval(() => {
      ctx.drawImage(
        videoElement,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const image = canvas.toDataURL("image/png");
      setSourceImg(image);
      send({
        ...baseArgs,
        image_url: image,
        prompt:
          getPrompt(inputRef.current) +
          ", masterpiece, best quality, unreal engine render",
      });
      // setImage(image);
      // console.log("updated image");
    }, 500);
    // You can also set intervals here for continuous capture
  }

  async function captureScreen() {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
      });
      // Handle the stream, e.g., display it in a video element
      const video = document.createElement("video");
      video.srcObject = mediaStream;
      video.onloadedmetadata = () => {
        video.play();
        captureImage(video); // Function to capture the image from the video
      };
    } catch (err) {
      console.error("Error: " + err);
    }
  }

  // Handle adding new input
  const addInput = () => {
    setInputs(inputs.concat({ id: nextId, value: "" }));
    setNextId(nextId + 1); // Increment nextId for a unique key for the next input
  };

  // Handle deleting an input
  const deleteInput = (id) => {
    setInputs(inputs.filter((input) => input.id !== id));
  };

  // Handle input change
  const handleInputChange = (id, newValue) => {
    setInputs(
      inputs.map((input) =>
        input.id === id ? { ...input, value: newValue } : input
      )
    );

    send({
      ...baseArgs,
      prompt:
        getPrompt(inputRef.current) +
        ", masterpiece, best quality, unreal engine render",
      image_url: sourceImg,
    });
  };

  // Construct the prompt
  const getPrompt = (inputs) => {
    return (
      inputs.map((input) => input.value).join(", ") +
      ", masterpiece, best quality, unreal engine render"
    );
  };

  return (
    <main className="p-10">
      <div className="img-wrapper">
        {!sourceImg && (
          <div className="btn-container">
            <button
              onClick={() => {
                captureScreen();
              }}
            >
              STREAM WORKSPACE{" "}
            </button>
          </div>
        )}
        {image && (
          <Image
            className="img1"
            src={image}
            width={550}
            height={550}
            alt="fal image"
          />
        )}
        {sourceImg && (
          <Image
            className="img2"
            src={sourceImg}
            width={550}
            height={550}
            alt="fal image"
          />
        )}
      </div>
      {/* <input
        className="p-4 w-full mb-2"
        value={input}
        onChange={async (e) => {
          setInput(e.target.value);
          send({
            ...baseArgs,
            prompt:
              e.target.value +
              ", masterpiece, best quality, unreal engine render",
            image_url: sourceImg,
          });
        }}
      ></input> */}
      <div className="input-group-wrapper">
        {inputs.map((input, index) => (
          <div key={input.id} className="input-group">
            <input
              className="p-4 w-full"
              value={input.value}
              onChange={(e) => handleInputChange(input.id, e.target.value)}
            />
            {index > 0 && ( // Only render the delete button for additional inputs
              <button onClick={() => deleteInput(input.id)}>Delete</button>
            )}
          </div>
        ))}
        <button
          onClick={addInput}
          style={{
            fontSize: "1.5em",
            height: "40px",
            width: "40px",
            padding: "0",
            marginTop: "8px",
          }}
        >
          +
        </button>
      </div>
    </main>
  );
}
