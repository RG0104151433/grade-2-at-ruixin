int count(int** matrix, int matrixSize, int mid) {
    int num=0;
    for (int i=0;i<matrixSize;i++) {//对于每一行矩阵进行二分查找，找出该行内小于等于这个数的数量
        if (matrix[i][0]>mid) break;//如果第一个数就大了，就可以直接跳出
        int left=0,right=matrixSize-1;
        while (left<=right) {
            int middle=left+(right-left)/2;
            if (matrix[i][middle]<=mid) left=middle+1;
            else right=middle-1;
        }
        num+=left;
    }
    return num;
}
int kthSmallest(int** matrix, int matrixSize, int* matrixColSize, int k) {
    int left=matrix[0][0],right=matrix[matrixSize-1][matrixSize-1];
    //在这个矩阵范围内二分查找
    while (left<right) {
        int mid=left+(right-left)/2;//这个mid是查找的元素
        int num=count(matrix,matrixSize,mid);//计算小于等于这个数的数字数量
        if (num<k) left=mid+1;
        else right=mid;
    }
    return left;
}
