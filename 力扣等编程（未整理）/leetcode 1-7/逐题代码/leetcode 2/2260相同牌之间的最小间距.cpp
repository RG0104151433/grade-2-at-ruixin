int minimumCardPickup(int* cards, int cardsSize) {
    int min=INT_MAX;
    int pos[1000001];//用来记录最近一次出现的位置
    for (int i=0;i<1000001;i++) pos[i]=-1;//对每一个都初始化，避免随即结果
    for (int i=0;i<cardsSize;i++) {
        if (pos[cards[i]]==-1) pos[cards[i]]=i;//如果是此前没有出现过，则进行记录
        else {//此时说明之前有出现过
            min=i-pos[cards[i]]+1<min?i-pos[cards[i]]+1:min;
            pos[cards[i]]=i;
        }
    }//区分i和cards[i]
    return min==INT_MAX?-1:min;
}
