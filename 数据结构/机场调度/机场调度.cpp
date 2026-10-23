#include <bits/stdc++.h>
using namespace std;

struct Plane {
    int id;
    int requestTime;
};

int main() {
    int R, landingTime, takeoffTime;
    if (scanf("%d%d%d", &R, &landingTime, &takeoffTime) != 3) return 0;

    vector<int> finishTime(R + 1, 0);
    vector<int> busyTime(R + 1, 0);

    queue<Plane> landingQueue;
    queue<Plane> takeoffQueue;

    int nextLandingId = 5001;
    int nextTakeoffId = 1;

    bool closed = false;
    int currentTime = 0;
    int simulationTime = 0;

    long long totalLandingWait = 0;
    long long totalTakeoffWait = 0;
    int landingCount = 0;
    int takeoffCount = 0;

    while (true) {
        printf("Current Time: %4d\n", currentTime);

        // Release runways that finish at this minute
        for (int r = 1; r <= R; ++r) {
            if (finishTime[r] > 0 && finishTime[r] == currentTime) {
                printf("runway %02d is free\n", r);
                finishTime[r] = 0;
            }
        }

        // Read new requests
        if (!closed) {
            int landNum, takeoffNum;
            if (scanf("%d%d", &landNum, &takeoffNum) != 2) {
                closed = true;
            } else if (landNum < 0 && takeoffNum < 0) {
                closed = true;
            } else {
                for (int i = 0; i < landNum; ++i) {
                    landingQueue.push({nextLandingId++, currentTime});
                }
                for (int i = 0; i < takeoffNum; ++i) {
                    takeoffQueue.push({nextTakeoffId++, currentTime});
                }
            }
        }

        // Schedule waiting planes.
        // Landings have priority over takeoffs.
        for (int r = 1; r <= R; ++r) {
            if (finishTime[r] != 0) continue;

            Plane p;
            bool isLanding;

            if (!landingQueue.empty()) {
                p = landingQueue.front();
                landingQueue.pop();
                isLanding = true;
            } else if (!takeoffQueue.empty()) {
                p = takeoffQueue.front();
                takeoffQueue.pop();
                isLanding = false;
            } else {
                break;
            }

            int duration = isLanding ? landingTime : takeoffTime;
            finishTime[r] = currentTime + duration;
            busyTime[r] += duration;

            if (isLanding) {
                totalLandingWait += currentTime - p.requestTime;
                ++landingCount;
                printf("airplane %04d is ready to land on runway %02d\n",
                       p.id, r);
            } else {
                totalTakeoffWait += currentTime - p.requestTime;
                ++takeoffCount;
                printf("airplane %04d is ready to takeoff on runway %02d\n",
                       p.id, r);
            }
        }

        // Check whether simulation is finished
        if (closed && landingQueue.empty() && takeoffQueue.empty()) {
            bool allIdle = true;
            for (int r = 1; r <= R; ++r) {
                if (finishTime[r] > currentTime) {
                    allIdle = false;
                    break;
                }
            }

            if (allIdle) {
                simulationTime = currentTime;
                break;
            }
        }

        ++currentTime;
    }

    printf("simulation finished\n");
    printf("simulation time: %4d\n", simulationTime);

    double avgLandingWait =
        landingCount ? (double)totalLandingWait / landingCount : 0.0;
    double avgTakeoffWait =
        takeoffCount ? (double)totalTakeoffWait / takeoffCount : 0.0;

    printf("average waiting time of landing: %4.1f\n", avgLandingWait);
    printf("average waiting time of takeoff: %4.1f\n", avgTakeoffWait);

    long long totalBusy = 0;
    for (int r = 1; r <= R; ++r) {
        printf("runway %02d busy time: %4d\n", r, busyTime[r]);
        totalBusy += busyTime[r];
    }

    double averageBusy = R ? (double)totalBusy / R : 0.0;
    double busyPercentage =
        simulationTime > 0 ? averageBusy * 100.0 / simulationTime : 0.0;

    printf("runway average busy time percentage: %4.1f%%\n", busyPercentage);

    return 0;
}
