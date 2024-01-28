import { Fragment, useState } from "react";
import * as React from "react";
import TextareaAutosize from "react-textarea-autosize";

function Question({ questions, setQuestions }) {
  return (
    <div className="flex flex-col w-full items-center">
      {questions.map((question, index) => {
        return (
          <div className="flex flex-row justify-between w-full items-center">
            <TextareaAutosize
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="w-full p-0"
              style={{
                padding: "1rem",
                border: "none",
                outline: "none",
                resize: "none",
              }}
              defaultValue={question.trim()}
              onChange={(e) => {
                setQuestions((prev) => {
                  const newQuestions = [...prev];
                  newQuestions[index] = e.target.value;
                  return newQuestions;
                });
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default Question;
