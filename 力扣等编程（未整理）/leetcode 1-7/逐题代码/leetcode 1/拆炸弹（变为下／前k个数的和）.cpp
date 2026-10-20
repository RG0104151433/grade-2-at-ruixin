/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
int* decrypt(int* code, int codeSize, int k, int* returnSize) {
    int* ans=malloc(codeSize*sizeof(int));
    *returnSize=codeSize;
    if (k==0) {
        for (int i=0;i<codeSize;i++) {
            ans[i]=0;
        }
    }
    else if (k>0) {
        for (int i=0;i<codeSize;i++) {
            ans[i]=0;
            for (int j=0;j<k;j++) {
                ans[i]+=code[(i+j+1)%codeSize];
            }
        }
    }
    else {
        for (int i=0;i<codeSize;i++) {
            ans[i]=0;
            for (int j=0;j>k;j--) {
                ans[i]+=code[(i+(codeSize+j-1))%codeSize];
            }
        }
    }
    return ans;
}
