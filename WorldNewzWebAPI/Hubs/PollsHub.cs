using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace WorldNewzWebAPI.Hubs
{
    public class PollsHub : Hub
    {
        // Clients connect to this SignalR Hub to receive real-time live voting updates ("PollUpdated")
        public async Task JoinPollGroup(string pollId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Poll_{pollId}");
        }

        public async Task LeavePollGroup(string pollId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Poll_{pollId}");
        }
    }
}
