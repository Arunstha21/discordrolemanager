import Image from "next/image";

export default function ServerCard({ server, serverSelected }) {
  return (
        <div onClick={()=> serverSelected(server)} className="bg-sky-100 rounded-lg shadow-md hover:bg-gray-100 overflow-hidden">
          <div className="h-32 bg-[#7289da] flex items-center justify-center">
            <span className="text-4xl text-white font-bold">
                {server.icon ? (
                    <Image
                    src={server.icon}
                    alt={server.shortName}
                    className="w-16 h-16 rounded-full"
                    />
                ) : (
                    <span>{server.shortName}</span>
                )}
            </span>
          </div>
          <div className="p-4 text-gray-950">
            <h3 className="text-lg font-semibold h-14">{server.name}</h3>
            <p className="text-muted-foreground text-sm">{server.memberCount} members</p>
            <div className="mt-4 p-2 rounded-lg border border-[#7289da] hover:bg-gray-400">
              <button variant="outline" className="w-full" onClick={(event) => event.stopPropagation()}>
                <a href={`https://discord.gg/${server.inviteCode}`}>Join Server</a>
              </button>
            </div>
          </div>
        </div>
  );
}
