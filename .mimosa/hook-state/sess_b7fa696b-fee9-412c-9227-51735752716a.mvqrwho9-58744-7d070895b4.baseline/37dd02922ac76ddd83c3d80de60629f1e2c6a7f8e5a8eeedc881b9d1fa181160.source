int cmp(const void* a, const void* b) {return *(int*)a-*(int*)b;}
int findRadius(int* houses, int housesSize, int* heaters, int heatersSize) {
    //思路是通过双指针遍历，找到房屋与供暖器的最大距离
    qsort(houses, housesSize, sizeof(int), cmp);
    qsort(heaters, heatersSize, sizeof(int),cmp);
    int ans=0,i=0,j=0;
    while (i<housesSize) {
        int current=ans;//记录在此之前的最大值
        ans=abs(houses[i]-heaters[j])>current?abs(houses[i]-heaters[j]):current;//对于一个i而言需要先赋初值
        while (j<heatersSize-1 && abs(houses[i]-heaters[j])>=abs(houses[i]-heaters[j+1])) {
            j++;
            ans=abs(houses[i]-heaters[j])>current?abs(houses[i]-heaters[j]):current;
        }
        i++;
    }
    return ans;
}
