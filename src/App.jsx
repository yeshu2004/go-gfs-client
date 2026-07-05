import { useEffect, useState } from "react";

const chunkAllocationResponse = {
  chunk_id: "",
  primary_server: "",
  replica_servers: [],
  primary_addr: "",
};
c
function App() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [chunkMetaDataResp, setChunkMetaDataResp] = useState(chunkAllocationResponse);

  // for logging purpose
  useEffect(() => {
    if (chunkMetaDataResp.primary_addr) {
      console.log("Primary addr: " + chunkMetaDataResp.primary_addr);
    }
  }, [chunkMetaDataResp.primary_addr]);

  // video submit handler when form is submitted
  var submitHandler = async (e) => {
    e.preventDefault();
    setError(null);

    if(!file){
      setError("file cannot be empty...please choose a file")
      return;
    }
  };

  // returns the respond from backend server i.e. chunkAllocationResponse
  async function askForChunks(file) {
    if(!file){
      setError("file cannot be empty...please choose a file")
      return;
    }

    if(file.type != "video/mp4" && file.type && "video/webm" && file.type != "application/octet-stream"){
      setError(`invaild file type i.e ${file.type}`)
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
    setChunkMetaDataResp(() => resp); // updates the primary chunk server addr
    console.log(resp);
  }

  return (
    <div style={{ padding: 20 }}>
      { error && (
        <div className="" style={{ paddingBottom: 10}}>
          {error}
        </div>
      )
      }

      <form onSubmit={submitHandler}>
        <input
          type="file"
          onChange={(e) => {
            setError(null)
            const file = e.target.files[0];
            console.log(file);
            if (file) {
              setFile(()=>file);
              askForChunks(file);
            }
          }}
        />
        <br />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default App;
