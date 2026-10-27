//给你一个数组，每一个位置不是一辆车初始地方位置和速度，方向均向右
//如果两辆车相撞则合成一个车队，速度为较低的一个
//返回一个数组，每个位置的数表示此处的车与右边的车相撞的时间，不会相撞则返回-1
class Solution {
public:
    vector<double> getCollisionTimes(vector<vector<int>>& cars) {
        vector<double> ans(cars.size());
        stack<int> stk;
        for (int i=cars.size()-1;i>=0;i--) {
            while (!stk.empty()) {
                if (cars[stk.top()][1]>=cars[i][1]) stk.pop();//及时清理无效数据
                else if (ans[stk.top()]<0) break;
                else {
                    double dx=ans[stk.top()]*abs(cars[stk.top()][1]-cars[i][1]);//此处不加else会导致第一个if处理完后进入这里
                    if (cars[stk.top()][0]-cars[i][0]<dx) break;
                    else stk.pop();
                }
            }
            if (stk.empty()) ans[i]= -1;
            else {
                double dt=(double)abs(cars[stk.top()][0]-cars[i][0])/(double)abs(cars[stk.top()][1]-cars[i][1]);
                ans[i]=dt;
            }
            stk.push(i);
        }
        return ans;
    }
};
//速度慢——绝对追不上==>但是有可能后面会追上，所以pop
//速度快，但是前面更早——相当于追下一个了==>先pop再说
//还有两种：本身就不会追上前面的，或者理论上追上的时间更晚
//速度快，前面也不会抢先碰上——追上的是这一辆==>此时计算时间
