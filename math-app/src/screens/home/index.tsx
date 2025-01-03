import React, { useEffect, useRef, useState } from "react";
import { SWATCHES } from "@/constants";
import { ColorSwatch, Group } from "@mantine/core";
import { Button } from "@/components/ui/button";
import axios from "axios";
import Draggable from "react-draggable";
interface Response {
  expr: string;
  result: string;
  assign: string;
}

interface GeneratedResult {
  expression: string;
  answer: string;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setUseDrawing] = useState(false);
  const [color, setColor] = useState("rgb(255, 255, 255)");
  const [reset, setReset] = useState(false);
  const [latexExpression, setLatexExpression] = useState<Array<string>>([]);
  const [latexPosition, setLatexPosition] = useState({ x: 10, y: 10 });
  const [result, setResult] = useState<GeneratedResult>();
  const [dictionaryOfVars, setDictionaryOfVars] = useState({});

  useEffect(() => {
    console.log(result);

    if (result) {
      renderLatexToCanvas(result.expression, result.answer);
    }
  }, [result, setResult]);

  useEffect(() => {
    if (latexExpression.length > 0 && window.MathJax) {
      setTimeout(() => {
        window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
      }, 0);
    }
  }, [latexExpression]);
  const draggableRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Initialize or update refs when latexExpression changes
  useEffect(() => {
    draggableRefs.current = draggableRefs.current.slice(
      0,
      latexExpression.length
    );
  }, [latexExpression]);
  const renderLatexToCanvas = (expression: string, answer: string) => {
    const latex = `\\(\\LARGE{ ${expression} = ${answer}}\\)`;
    console.log(latex);

    setLatexExpression([...latexExpression, latex]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };
  useEffect(() => {
    if (reset) {
      resetCanvas();
      setReset(false);
      setLatexExpression([]);
      setResult(undefined);
      setDictionaryOfVars({});
    }
  }, [reset]);

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const sendData = async () => {
    // setDictionaryOfVars({...dictionaryOfVars, "x": 10})
    const canvas = canvasRef.current;
    if (canvas) {
      console.log(`${import.meta.env.VITE_API_URL}/calculate`);
      console.log({
        image: canvas.toDataURL("image/png"),
        dictionary_of_vars: dictionaryOfVars,
      });

      const response = await axios({
        method: "post",
        url: `${import.meta.env.VITE_API_URL}/calculate`,
        data: {
          image: canvas.toDataURL("image/png"),
          dictionary_of_vars: dictionaryOfVars,
        },
        headers: {
          "Content-Type": "application/json",
        },
      });
      const finalResponse = await response.data;
      finalResponse.data.forEach((data: Response) => {
        if (data.assign === "true") {
          setDictionaryOfVars({
            ...dictionaryOfVars,
            [data.expr]: data.result,
          });
        }
      });

      const ctx = canvas.getContext("2d");
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      let minX = canvas.width,
        minY = canvas.height,
        maxX = 0,
        maxY = 0;

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          if (imageData != null && imageData.data[i + 3] > 0) {
            // If pixel is not transparent
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      setLatexPosition({ x: centerX, y: centerY });
      finalResponse.data.forEach((data: Response) => {
        setTimeout(() => {
          setResult({
            expression: data.expr,
            answer: data.result,
          });
        }, 1000);
      });
    }
  };
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // set canvas size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - canvas.offsetTop;
        ctx.lineCap = "round";
        ctx.lineWidth = 5;
      }
    }
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML";

    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.MathJax.Hub.Config({
        tex2jax: {
          inlineMath: [
            ["$", "$"],
            ["\\(", "\\)"],
          ],
        },
      });
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.background = "black";
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        setUseDrawing(true);
      }
    }
  };
  const stopDrawing = (_e: React.MouseEvent<HTMLCanvasElement>) => {
    setUseDrawing(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) {
      return;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = color;
        // follow the mouse
        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        // stroke the line on canvas
        ctx.stroke();
      }
    }
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <Button
          onClick={() => {
            setReset(true);
          }}
          className="z-20 bg-black text-white"
          variant="default"
          color="black"
        >
          Reset
        </Button>

        <Group className="z-20">
          {SWATCHES.map((swatchColor: string) => {
            return (
              <ColorSwatch
                key={swatchColor}
                color={swatchColor}
                onClick={() => {
                  setColor(swatchColor);
                }}
              />
            );
          })}
        </Group>
        <Button
          onClick={sendData}
          className="z-20 bg-black text-white"
          variant="default"
          color="black"
        >
          {" "}
          Calculate
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        id="canvas"
        className="absolute top-0 left-0 w-full h-full"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseOut={stopDrawing}
        onMouseUp={stopDrawing}
      ></canvas>
      {latexExpression.map((latex, index) => (
        <Draggable
          key={index}
          nodeRef={
            draggableRefs.current[index]
              ? { current: draggableRefs.current[index] }
              : undefined
          }
          defaultPosition={latexPosition}
          onStop={(_e, data) => setLatexPosition({ x: data.x, y: data.y })}
        >
          <div
            ref={(el) => (draggableRefs.current[index] = el)}
            className="absolute p-2 text-white rounded shadow-md cursor-pointer"
          >
            <div className="text-white font-bold">{latex}</div>
          </div>
        </Draggable>
      ))}
    </>
  );
}
