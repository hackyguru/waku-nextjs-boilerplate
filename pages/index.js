import { useEffect, useState } from "react";

// Icon Imports
import { FaGithub } from "react-icons/fa";


// Waku Imports
import { createLightNode } from "@waku/sdk";
import { waitForRemotePeer } from "@waku/sdk";
import { createEncoder, createDecoder } from "@waku/sdk";

// Protobuf Import
import protobuf from "protobufjs";

export default function Home() {
  const [node, setNode] = useState(null)
  const [peers, setPeers] = useState(false)
  const [encoders, setEncoders] = useState(null)
  const [decoders, setDecoders] = useState(null)
  const [error, setErrror] = useState(null)
  const [receivedData, setReceivedData] = useState(null)
  const [sendingData, setSendingData] = useState(null)


  // Choose a content topic
  const contentTopic = "/light-guide/1/message/proto";

  // Create a message structure using Protobuf
  const ChatMessage = new protobuf.Type("ChatMessage")
    .add(new protobuf.Field("timestamp", 1, "uint64"))
    .add(new protobuf.Field("data", 2, "string"));


  async function sendData() {

    if (node && peers && encoders && decoders) {

      // Create a new message object
      const protoMessage = ChatMessage.create({
        timestamp: Date.now(),
        data: sendingData,
      });

      // Serialise the message using Protobuf
      const serialisedMessage = ChatMessage.encode(protoMessage).finish();

      // Send the message using Light Push
      await node.lightPush.send(encoders, {
        payload: serialisedMessage,
      });

      console.log("Message sent!!!!", serialisedMessage)
    }
    else {
      setErrror("Requirements not ready!")
      console.log(error)
    }
  }

  useEffect(() => {
    const setupNode = async () => {

      // Create and start a Light Node
      const node = await createLightNode({ defaultBootstrap: true });
      await node.start();
      setNode(node);
      console.log("Node started!")

      // Wait for a successful peer connection
      await waitForRemotePeer(node);
      setPeers(true)
      console.log("Remote peers connected!")

      // Create a message encoder and decoder
      const encoder = createEncoder({
        contentTopic: contentTopic, // message content topic
        ephemeral: true, // allows messages not be stored on the network
      });
      setEncoders(encoder)
      const decoder = createDecoder(contentTopic);
      setDecoders(decoder)

      // Create the callback function
      const callback = async (wakuMessage) => {
        // Check if there is a payload on the message
        if (!wakuMessage.payload) return;
        // Render the messageObj as desired in your application
        const messageObj = await ChatMessage.decode(wakuMessage.payload);
        setReceivedData(messageObj);
        console.log(receivedData);
      };

      // Create a Filter subscription
      const subscription = await node.filter.createSubscription();

      // Subscribe to content topics and process new messages
      await subscription.subscribe([decoder], callback);
    }


    setupNode();
  }, []);

  return (
    <>
      <header className="flex justify-between items-center p-5">
        <h1 className="text-xl">Waku NextJS Boilerplate</h1>
        <a className="https://github.com/hackyguru/waku-nextjs-boilerplate">
        <FaGithub size={20} />
        </a>
      </header>
      <main className="text-center mt-40 flex-col space-y-5">
        <div className="border border-white w-full flex text-start">
          <div className="w-1/6  border-r p-5">Step 1</div>
          <div className="w-4/6  border-r p-5">Create Light Node</div>
          <div className="w-1/6  p-5">
            {node ? <div className="text-green-300">Completed</div> : <div className="animate-pulse">Pending</ div>}</div>
        </div>

        <div className="border border-white w-full flex text-start">
          <div className="w-1/6  border-r p-5">Step 2</div>
          <div className="w-4/6  border-r p-5">Discover peers around you</div>
          <div className="w-1/6  p-5">
            {peers ? <div className="text-green-300">Completed</div> : <div className="animate-pulse">Pending</ div>}</div>
        </div>

        <div className="border border-white w-full flex text-start">
          <div className="w-1/6  border-r p-5">Step 3</div>
          <div className="w-4/6  border-r p-5">Setup encoders and decoders</div>
          <div className="w-1/6  p-5">
            {encoders && decoders ? <div className="text-green-300">Completed</div> : <div className="animate-pulse">Pending</ div>}</div>
        </div>


        <div className="border border-white w-full flex text-start">
          <div className="w-1/2 border-r border-white">
            <div className="border-b border-white p-5">Send data to a content topic</div>
            <div className="p-5">
              <div className="flex w-full justify-between space-x-3">
                <input onChange={(e) => setSendingData(e.target.value)} placeholder="Data" className="w-full bg-transparent px-4 border" />
                <button onClick={() => sendData()} className="bg-white text-black p-2 border-l border-black">Send</button>
              </div>
            </div>
          </div>

          <div className="w-1/2 border-r border-white">
            <div className="border-b border-white p-5">Receive data from a content topic</div>
            <div className="p-5">
              <div className="w-full border border-white p-2">
                {
                  receivedData != null ? <div>{receivedData.data}</div> :
                    <div className="opacity-60">Received data will be automatically shown here</div>
                }
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
