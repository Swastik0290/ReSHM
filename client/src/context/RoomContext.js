import React, { createContext, useContext, useState } from 'react';

const RoomContext = createContext(null);

export const RoomProvider = ({ children }) => {
    const [selectedRoomId, setSelectedRoomId] = useState(null);

    return (
        <RoomContext.Provider value={{ selectedRoomId, setSelectedRoomId }}>
            {children}
        </RoomContext.Provider>
    );
};

export const useRoom = () => useContext(RoomContext);
