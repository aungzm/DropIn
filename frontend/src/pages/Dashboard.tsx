import React from 'react';
import Navbar from '../components/Navbar';
import Space from '../components/Space';
import AddSpace from '../components/AddSpace';

const Dashboard = () => {
    const [firstSpaceName, setFirstSpaceName] = React.useState("Example Space");
    return (
        <div className="min-h-screen bg-white-100" >
            <Navbar />
            <div className="pt-24 px-8 flex flex-wrap items-center gap-8">
                <Space 
                    spaceName={firstSpaceName} 
                    creator="Sample Author" 
                    onDelete={() => console.log('Delete clicked')}
                    onRename={(newName) => setFirstSpaceName(newName)}
                />
                <Space 
                    spaceName="Example Space" 
                    creator="Sample Author" 
                    onDelete={() => console.log('Delete clicked')}
                    onRename={(newName) => console.log('Rename clicked:', newName)}
                />
                <Space 
                    spaceName="Example Space" 
                    creator="Sample Author" 
                    onDelete={() => console.log('Delete clicked')}
                    onRename={(newName) => console.log('Rename clicked:', newName)}
                />
                <Space 
                    spaceName="Example Space" 
                    creator="Sample Author" 
                    onDelete={() => console.log('Delete clicked')}
                    onRename={(newName) => console.log('Rename clicked:', newName)}
                />
                <Space 
                    spaceName="Example Space" 
                    creator="Sample Author" 
                    onDelete={() => console.log('Delete clicked')}
                    onRename={(newName) => console.log('Rename clicked:', newName)}
                />
                <Space 
                    spaceName="Example Space" 
                    creator="Sample Author" 
                    onDelete={() => console.log('Delete clicked')}
                    onRename={(newName) => console.log('Rename clicked:', newName)}
                />
                <AddSpace />
            </div>
        </div>
    );
};

export default Dashboard;