import { useEffect, useState } from "react";

const chunkAllocationResponse = {
  chunk_id: "",
  primary_server_name: "",
  replica_servers: [],
  primary_addr: "",
  chunk_size: 0,
};

function App() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [chunkMetaDataResp, setChunkMetaDataResp] = useState([]);
  const [fileSize, setFileSize] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [maxChunkSize, setMaxChunkSize] = useState(0);

  // for logging purpose
  useEffect(() => {
    if (chunkMetaDataResp.primary_addr) {
      console.log("Primary addr: " + chunkMetaDataResp.primary_addr);
    }
    if (fileSize) {
      console.log("File size:", fileSize);
    }
    console.log("TotalChunks:", totalChunks);
  }, [chunkMetaDataResp, fileSize, totalChunks]);

  // video submit handler when form is submitted
  var submitHandler = async (e) => {
    e.preventDefault();
    setError(null);

    if (error) {
      alert("Cannot upload file");
    }

    // if user tries to submit without choosing file
    if (!file) {
      setError("file cannot be empty...please choose a file");
      return;
    }

    for (let i = 0; i < totalChunks; i++) {
      const chunkMeta = await askForChunks(file);

      let start = i * maxChunkSize;
      let end = Math.min(start + maxChunkSize, fileSize);
      const chunk = file.slice(start, end);

      // logging purpose
      console.log({
        chunkId: chunkMeta.chunk_id,
        primaryAddr: chunkMeta.primary_addr,
        start,
        end,
        chunkSize: chunk.size,
      });

      // attemp to upload bytes
      const formData = new FormData();
      formData.append("video_chunk", chunk, `${file.name}.part${i}`);

      const resp = await fetch(
        `http://localhost${chunkMeta.primary_addr}/upload/${chunkMeta.chunk_id}`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!resp.ok) {
        console.log(await resp.text());
        return;
      }

      console.log(resp);
      const response = await resp.text();
      console.log(response);
    }
  };

  // returns the respond from backend server i.e. chunkAllocationResponse
  async function askForChunks(file) {
    if (!file) {
      setError("file cannot be empty...please choose a file");
      return;
    }

    if (
      file.type !== "video/mp4" &&
      file.type !== "video/webm" &&
      file.type !== "application/octet-stream"
    ) {
      setError(`invaild file type i.e ${file.type}`);
      return;
    }

    const response = await fetch("http://localhost:8000/chunk-server", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        file_name: file.name,
      }),
    });

    if (!response.ok) {
      setError("error from the server");
      return;
    }

    const resp = await response.json();
    setChunkMetaDataResp((prev) => [...prev, resp]); // updates the primary chunk server addr
    console.log(resp);
    return resp;
  }

  async function askForMaxChunkSize() {
    const response = await fetch("http://localhost:8000/max-chunk-size", {
      method: "GET",
    });
    if (!response.ok) {
      setError(
        "Error in fetching the max chunk size from server: Server Error",
      );
      return;
    }

    const resp = await response.json();
    return resp.max_chunk_size;
  }

  return (
    <div style={{ padding: 20 }}>
      {error && (
        <div className="" style={{ paddingBottom: 10 }}>
          {error}
        </div>
      )}

      <form onSubmit={submitHandler}>
        <input
          type="file"
          onChange={async (e) => {
            setError(null);
            const file = e.target.files[0];
            console.log(file);
            if (file) {
              const chunkSize = await askForMaxChunkSize();
              setFile(() => file);
              setFileSize(() => file.size);
              setMaxChunkSize(chunkSize);
              setTotalChunks(() => Math.ceil(file.size / chunkSize)); // total number of chunks posible to upload them on backend
            }
          }}
        />
        <br />
        {error ? (
          <button disabled type="submit">
            Error
          </button>
        ) : (
          <button type="submit">Submit</button>
        )}
      </form>
    </div>
  );
}

export default App;
