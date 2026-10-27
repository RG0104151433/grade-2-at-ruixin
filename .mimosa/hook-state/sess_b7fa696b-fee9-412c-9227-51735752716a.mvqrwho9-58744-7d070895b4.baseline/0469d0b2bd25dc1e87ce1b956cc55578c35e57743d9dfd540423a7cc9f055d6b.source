/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
int* xorQueries(int* arr, int arrSize, int** queries, int queriesSize, int* queriesColSize, int* returnSize) {
    *returnSize=queriesSize;
    int xors[arrSize+1];
    int* result=(int*)malloc(sizeof(int)*queriesSize);
    xors[0]=0;
    for (int i=1;i<=arrSize;i++) xors[i]=xors[i-1]^arr[i-1];
    for (int i=0;i<queriesSize;i++) {
        result[i]=xors[queries[i][1]+1]^xors[queriesSize[i][0]];
    }
    return reuslt;
}
