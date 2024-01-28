import React, { useState } from "react";
import Dropzone from "react-dropzone";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import QuestionAnswers from "./QuestionAnswers";
import TextareaAutosize from "react-textarea-autosize";
import api from "../utils/api";

function Homepage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  // const [data, setData] = useState(dummyData);
  const [questions, setQuestions] = useState([]);
  const [answerLimit, setAnswerLimit] = useState(60);
  const [addWordLimit, setAddWordLimit] = useState(false);
  const notify = (message) => toast(message);

  const [open, setOpen] = useState(false);

  const onOpenModal = () => setOpen(true);
  const onCloseModal = () => setOpen(false);

  const updateData = (index, question, answer) => {
    const newData = [...data];
    newData[index].question = question;
    newData[index].answer = answer;
    setData(newData);
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      notify("Please upload at least one file!");
      return;
    }

    //  show question mode
    if (data) {
      setOpen(true);
      return;
    }
    setLoading(true);

    try {
      const form = new FormData();
      for (const file of files) {
        form.append("file", file);
      }

      const res = await api.post("/get_questions", form, {
        headers: {
          accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.error) {
        console.log(res.data.error);
        notify(res.data.error.slice(0, 150));
      } else {
        setQuestions(res.data.message);
        notify("Questions extracted successfully!");
        setOpen(true);
      }
      setLoading(false);
    } catch (err) {
      console.log(err);
      notify("Something went wrong!");
      setLoading(false);
    }
  };

  const handleExtractAnswers = async () => {
    setLoading(true);
    setData(null);
    try {
      const res = await api.post(
        "/get_answers",
        {
          questions: questions,
          max_words: addWordLimit ? parseInt(answerLimit) : null,
        },
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      if (res.data.error) {
        notify(res.data.error.slice(0, 150));
      } else {
        setData(
          res.data.message.map((item, index) => {
            return {
              timestamp: new Date().toLocaleString() + "|||" + index,
              question: item.question,
              answer: item.answer,
            };
          })
        );
        setOpen(false);
      }
      setLoading(false);
    } catch (err) {
      console.log(err);
      notify("Something went wrong!");
      setLoading(false);
    }
  };

  return (
    <div className="Home">
      <Modal
        open={open}
        onClose={onCloseModal}
        closeOnEsc={false}
        closeOnOverlayClick={false}
        showCloseIcon={false}
        center
        classNames={{
          overlay: "questionOverlay",
          modal: "questionModal",
        }}
        styles={{
          modal: { padding: "3rem", textAlign: "center" },
          overlay: {},
          modalContainer: {},
        }}
      >
        <div className="flex flex-col items-center justify-center">
          <div className="text-2xl font-bold">Questions</div>
          <div className="text-sm text-gray-500">
            Important: Remove Headers Footers, Only keep the question and each
            of them should start with question number and ".", Example: 1. and
            2.
          </div>
        </div>
        <div className="mt-4">
          {questions.map((question, index) => {
            return (
              <TextareaAutosize
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="w-full mr-4 bg-slate-100 rounded-md mb-4 border-2 border-solid border-gray-400 text-gray-600"
                style={{
                  padding: "1rem",
                  outline: "none",
                  resize: "none",
                }}
                defaultValue={question.trim()}
                onChange={(e) => {
                  let oldQuestions = [...questions];
                  oldQuestions[index] = e.target.value;
                  setQuestions(oldQuestions);
                }}
              />
            );
          })}

          <div class="flex flex-row items-center justify-center mb-4">
            <input
              id="default-checkbox"
              type="checkbox"
              checked={addWordLimit}
              onChange={() => setAddWordLimit(!addWordLimit)}
              class="w-4 h-4 accent-red-500 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2 "
            />
            <label class="ml-2 text-sm font-medium text-gray-900">
              Set Word Limit
            </label>
          </div>

          {addWordLimit && (
            <div className="text-center flex flex-col items-center text-md font-extrabold mb-4">
              Answer Length
              <br />
              (in words)
              <input
                className="text-center text-3xl w-36 border-2 border-red-500 rounded-md"
                type="number"
                value={answerLimit}
                onChange={(e) => {
                  setAnswerLimit(e.target.value);
                }}
              />
            </div>
          )}

          <div className="flex flex-col md:flex-row w-full text-center items-center justify-center">
            <button
              onClick={onCloseModal}
              className="m-1 w-44 whitespace-nowrap inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-red-500 hover:bg-red-600"
            >
              Cancel
            </button>
            <button
              onClick={handleExtractAnswers}
              disabled={loading}
              className="m-1 w-44 whitespace-nowrap inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-red-500 hover:bg-red-600"
            >
              {loading && (
                <div role="status">
                  <svg
                    aria-hidden="true"
                    className="w-5 h-5 mr-2 text-gray-200 animate-spin fill-red-600"
                    viewBox="0 0 100 101"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                      fill="currentColor"
                    />
                    <path
                      d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                      fill="currentFill"
                    />
                  </svg>
                </div>
              )}
              Extract Answers
            </button>
          </div>
        </div>
      </Modal>

      <ToastContainer />

      <div className="text-center mb-2 text-3xl font-extrabold leading-none tracking-tight text-red-500 md:text-2xl lg:text-4xl">
        Welcome to <span className="font-extrabold   ">LmaoAI!</span>
      </div>
      <div className="text-center hidden md:block mb-2 text-md  leading-none tracking-tight text-gray-500 md:text-lg lg:text-xl">
        Instant and Accurate academic assistance.
      </div>

      {/* <div className="text-center mb-4 text-xl  leading-none tracking-tight text-gray-500 md:text-lg lg:text-xl ">
        Let's revolutionize learning together!
      </div> */}
      {/* <div className="secondary-title">
        Experience the power of AI for instant, accurate, and free academic
        assistance.
      </div> */}

      <Dropzone
        onDrop={(acceptedFiles) => {
          setData(null);
          setFiles(acceptedFiles);
        }}
        noClick={true}
        noKeyboard={true}
      >
        {({ getRootProps, getInputProps, isDragActive, open }) => (
          <section>
            <div
              {...getRootProps()}
              className="h-48 m-auto md:w-2/3  bg-gray-200 text-2xl rounded-lg border-dashed border-2 border-red-500 items-center justify-center flex"
            >
              <input {...getInputProps()} />

              {isDragActive ? (
                <p className="text-center align-center text-2xl text-gray-500">
                  Drag files into this area!
                </p>
              ) : (
                <>
                  {files.length == 0 ? (
                    <div className="flex flex-col content-center justify-center items-center ">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-14 h-14 text-red-500"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
                        />
                      </svg>

                      <button
                        className="flex gap-2 flex-row text-xl m-3  rounded-md text-white bg-red-500 px-3 py-2 hover:bg-red-400"
                        onClick={open}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                          />
                        </svg>
                        Upload
                      </button>

                      <p className="hidden md:block text-center align-center text-xl  text-gray-500">
                        Drag your files here! (pdf/image/docx){" "}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      {files.map((file, i) => {
                        return (
                          <div
                            id={i}
                            className="flex flex-col lg:flex-row content-center justify-center items-center "
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="h-12 w-12 text-red-500"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                              />
                            </svg>
                            {file.name}
                          </div>
                        );
                      })}
                      <button
                        className="flex gap-2 flex-row text-xl m-3  rounded-md text-white bg-red-500 px-3 py-2 hover:bg-red-400"
                        onClick={open}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                          />
                        </svg>
                        Upload
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        )}
      </Dropzone>

      <div className="text-center m-4 text-md  leading-none tracking-tight text-gray-500 md:text-lg lg:text-xl">
        Or,{" "}
        <span
          className="underline cursor-pointer text-red-500"
          onClick={() => {
            setQuestions([""]);
            setOpen(true);
          }}
        >
          Type the questions instead.
        </span>
      </div>

      {files && files.length > 0 && (
        <div className="text-center pt-5">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="m-6 whitespace-nowrap inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-red-500 hover:bg-red-600"
          >
            {loading && (
              <div role="status">
                <svg
                  aria-hidden="true"
                  className="w-5 h-5 mr-2 text-gray-200 animate-spin fill-red-600"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
              </div>
            )}
            {loading ? "Extracting..." : data ? "Show questions" : "Continue"}
          </button>
        </div>
      )}
      {data && (
        <QuestionAnswers data={data} updateData={updateData} notify={notify} />
      )}
      <div class="py-12 my-8">
        <div class="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col md:flex-row gap-12 justify-between mx-4">
            <div class="flex-1 flex flex-col items-center text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
                />
              </svg>

              <h2 class="text-l font-bold text-gray-900 mb-2">
                Upload your document
              </h2>
              <p class="text-gray-700 text-base">
                Upload your document and wait while the platform analyzes it for
                relevant questions. We support PDF, DOCX, Images.
              </p>
            </div>
            <div class="flex-1 flex flex-col items-center text-center ">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <h2 class="text-l font-bold text-gray-900 mb-2">
                Review detected questions
              </h2>
              <p class="text-gray-700 text-base">
                Review the list of potential questions generated by the
                platform. Select which questions you want the AI platform to
                answer.
              </p>
            </div>
            <div class="flex-1 text-center flex flex-col items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>

              <h2 class="text-l font-bold text-gray-900 mb-2">
                Get your answers
              </h2>
              <p class="text-gray-700 text-base">
                Receive answers based on the information in your document. Use
                the answers to gain insights or make informed decisions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Homepage;
