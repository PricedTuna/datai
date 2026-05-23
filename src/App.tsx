import { useMessages } from './hooks/useMessages';
import { Chat } from './pages/Chat';


function App() {

  const { messages, isLoading, sendMessage } = useMessages();

  return (
    <div>
      <Chat
        messages={messages}
        isLoading={isLoading}
        onSendMessage={(message) => {
          sendMessage(message);
        }}
      />
    </div>
  )
}

export default App
