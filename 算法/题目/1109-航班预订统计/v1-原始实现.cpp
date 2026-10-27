/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
int* corpFlightBookings(int** bookings, int bookingsSize, int* bookingsColSize, int n, int* returnSize) {
    int* answer=(int*)calloc(n,sizeof(int));
    int* diff=calloc(n+2,sizeof(int));
    int s=0;
    *returnSize=n;
    for (int i=0;i<bookingsSize;i++) {
        diff[bookings[i][0]]+=bookings[i][2];
        diff[bookings[i][1]+1]-=bookings[i][2];
    }
    for (int i=1;i<n+1;i++) {
        s+=diff[i];
        answer[i-1]=s;
    }
    return answer;
}
