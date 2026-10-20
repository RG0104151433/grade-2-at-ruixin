/**
 * Return an array of arrays of size *returnSize.
 * The sizes of the arrays are returned as *returnColumnSizes array.
 * Note: Both returned array and *columnSizes array must be malloced, assume caller calls free().
 */
int** colorGrid(int n, int m, int** sources, int sourcesSize, int* sourcesColSize, int* returnSize, int** returnColumnSizes) {
    int** col=(int**)malloc(n*sizeof(int*));
    for (int i=0;i<n;i++) col[i]=(int*)malloc(m*sizeof(int));
    for (int i=0;i<n;i++) {
        for (int j=0;j<m;j++) col[i][j]=0;
    }
    *returnSize=n;
    *returnColumnSizes=(int*)malloc(n*sizeof(int));
    for (int i=0;i<n;i++) (*returnColumnSizes)[i]=m;
    for (int i=0;i<sourcesSize;i++) col[sources[i][0]][sources[i][1]]=sources[i][2];
    for (int i=0;i<n;i++) {
        for (int j=0;j<m;j++) {
            int num=0,pos=-1,dis=INT_MAX;
            for (int k=0;k<sourcesSize;k++) {
                int temp=abs(sources[k][0]-i)+abs(sources[k][1]-j);
                if (temp<dis || temp==dis && sources[k][2]>num) {
                    pos=k;
                    dis=temp;
                    num=sources[k][2];
                }
            }
            col[i][j]=num;
        }
    }
    return col;
}
//该程序运行时间超时
